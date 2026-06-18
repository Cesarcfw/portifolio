async function getRepos(req, res) {
  try {
    const reposRes = await fetch(
      `https://api.github.com/users/${process.env.GITHUB_USERNAME}/repos?sort=updated&per_page=20`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    )

    const repos = await reposRes.json()

    // Busca a última release de cada repo em paralelo
    const formatted = await Promise.all(
      repos
        .filter(repo => !repo.fork && repo.name.toLowerCase() !== process.env.GITHUB_USERNAME.toLowerCase())
        .map(async repo => {
          let latestRelease = null
          let commitCount = 0

          // Busca release e commits em paralelo
          const [releaseResult, commitsResult] = await Promise.allSettled([
            fetch(
              `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${repo.name}/releases/latest`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                  Accept: 'application/vnd.github.v3+json'
                }
              }
            ),
            fetch(
              `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${repo.name}/commits?per_page=1`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                  Accept: 'application/vnd.github.v3+json'
                }
              }
            )
          ])

          // Extrai release
          if (releaseResult.status === 'fulfilled' && releaseResult.value.ok) {
            const release = await releaseResult.value.json()
            latestRelease = release.tag_name
          }

          // Extrai total de commits pelo header Link
          if (commitsResult.status === 'fulfilled' && commitsResult.value.ok) {
            const linkHeader = commitsResult.value.headers.get('link')
            if (linkHeader) {
              const match = linkHeader.match(/page=(\d+)>; rel="last"/)
              if (match) commitCount = parseInt(match[1])
            } else {
              // Se não tem Link header, tem 0 ou 1 commit
              const commits = await commitsResult.value.json()
              commitCount = commits.length
            }
          }

          return {
            id: repo.id,
            name: repo.name,
            description: repo.description,
            url: repo.html_url,
            stars: repo.stargazers_count,
            language: repo.language,
            topics: repo.topics,
            updatedAt: repo.updated_at,
            version: latestRelease,
            commits: commitCount
          }
        })
    )

    res.json(formatted)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar repositórios do GitHub' })
  }
}

async function getContributions(req, res) {
  try {
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  color
                }
              }
            }
          }
        }
      }
    `

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: { username: process.env.GITHUB_USERNAME }
      })
    })

    const data = await response.json()

    if (data.errors) {
      return res.status(400).json({ error: data.errors[0].message })
    }

    const calendar = data.data.user.contributionsCollection.contributionCalendar

    res.json({
      total: calendar.totalContributions,
      weeks: calendar.weeks
    })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar contribuições do GitHub' })
  }
}

async function getLanguages(req, res) {
  try {
    const query = `
      query($username: String!) {
        user(login: $username) {
          repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
            nodes {
              name
              languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                edges {
                  size
                  node {
                    name
                    color
                  }
                }
              }
            }
          }
        }
      }
    `

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: { username: process.env.GITHUB_USERNAME }
      })
    })

    const data = await response.json()

    if (data.errors) {
      return res.status(400).json({ error: data.errors[0].message })
    }

    const repos = data.data.user.repositories.nodes
    const langStats = {}
    let totalSize = 0

    repos.forEach(repo => {
      repo.languages.edges.forEach(edge => {
        let name = edge.node.name
        const size = edge.size
        const color = edge.node.color

        // Ignorar Batchfile
        if (name.toLowerCase() === 'batchfile') return

        // Renomear Jupyter Notebook
        if (name === 'Jupyter Notebook') {
          name = 'Python (Jupyter Notebook)'
        }

        if (!langStats[name]) {
          langStats[name] = { name, color, size: 0 }
        }
        langStats[name].size += size
        totalSize += size
      })
    })

    // Calcular porcentagens e ordenar
    const result = Object.values(langStats)
      .map(lang => ({
        ...lang,
        percentage: Number(((lang.size / totalSize) * 100).toFixed(1))
      }))
      .sort((a, b) => b.size - a.size)

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar linguagens do GitHub' })
  }
}

module.exports = { getRepos, getContributions, getLanguages }