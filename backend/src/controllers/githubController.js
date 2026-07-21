const responseCache = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000
const GITHUB_TIMEOUT_MS = 10 * 1000

function githubFetch(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS) })
}

function getCached(key) {
  const entry = responseCache.get(key)
  if (!entry || entry.expiresAt <= Date.now()) {
    responseCache.delete(key)
    return null
  }
  return entry.value
}

function setCached(key, value) {
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

function getGithubConfig() {
  const username = (process.env.GITHUB_USERNAME || '').trim()
  const token = (process.env.GITHUB_TOKEN || '').trim()
  return username && token ? { username, token } : null
}

async function getRepos(req, res) {
  const cached = getCached('repos')
  if (cached) return res.json(cached)

  try {
    const config = getGithubConfig()
    if (!config) return res.status(503).json({ error: 'Integração com GitHub não configurada' })
    const reposRes = await githubFetch(
      `https://api.github.com/users/${encodeURIComponent(config.username)}/repos?sort=updated&per_page=20`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    )

    if (!reposRes.ok) throw new Error(`GitHub REST retornou HTTP ${reposRes.status}`)

    const repos = await reposRes.json()
    if (!Array.isArray(repos)) throw new Error('Resposta inesperada da API do GitHub')

    // Busca a última release de cada repo em paralelo
    const formatted = await Promise.all(
      repos
        .filter(repo => !repo.fork && repo.name.toLowerCase() !== config.username.toLowerCase())
        .map(async repo => {
          let latestRelease = null
          let commitCount = 0

          // Busca release e commits em paralelo
          const [releaseResult, commitsResult] = await Promise.allSettled([
            githubFetch(
              `https://api.github.com/repos/${encodeURIComponent(config.username)}/${encodeURIComponent(repo.name)}/releases/latest`,
              {
                headers: {
                  Authorization: `Bearer ${config.token}`,
                  Accept: 'application/vnd.github.v3+json'
                }
              }
            ),
            githubFetch(
              `https://api.github.com/repos/${encodeURIComponent(config.username)}/${encodeURIComponent(repo.name)}/commits?per_page=1`,
              {
                headers: {
                  Authorization: `Bearer ${config.token}`,
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

    setCached('repos', formatted)
    res.json(formatted)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar repositórios do GitHub' })
  }
}

async function getContributions(req, res) {
  const cached = getCached('contributions')
  if (cached) return res.json(cached)

  try {
    const config = getGithubConfig()
    if (!config) return res.status(503).json({ error: 'Integração com GitHub não configurada' })
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

    const response = await githubFetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: { username: config.username }
      })
    })

    if (!response.ok) throw new Error(`GitHub GraphQL retornou HTTP ${response.status}`)

    const data = await response.json()

    if (data.errors) {
      return res.status(502).json({ error: 'Erro ao consultar contribuições no GitHub' })
    }

    const calendar = data.data.user.contributionsCollection.contributionCalendar

    const result = {
      total: calendar.totalContributions,
      weeks: calendar.weeks
    }
    setCached('contributions', result)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar contribuições do GitHub' })
  }
}

async function getLanguages(req, res) {
  const cached = getCached('languages')
  if (cached) return res.json(cached)

  try {
    const config = getGithubConfig()
    if (!config) return res.status(503).json({ error: 'Integração com GitHub não configurada' })
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

    const response = await githubFetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: { username: config.username }
      })
    })

    if (!response.ok) throw new Error(`GitHub GraphQL retornou HTTP ${response.status}`)

    const data = await response.json()

    if (data.errors) {
      return res.status(502).json({ error: 'Erro ao consultar linguagens no GitHub' })
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
        percentage: totalSize > 0 ? Number(((lang.size / totalSize) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.size - a.size)

    setCached('languages', result)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar linguagens do GitHub' })
  }
}

async function getPortfolioVersion(req, res) {
  const cached = getCached('version')
  if (cached) return res.json(cached)

  try {
    const config = getGithubConfig()
    if (!config) {
      const fallback = { version: 'v1.0.0' }
      setCached('version', fallback)
      return res.json(fallback)
    }

    // 1. Tenta buscar a release mais recente
    const response = await githubFetch(
      `https://api.github.com/repos/${encodeURIComponent(config.username)}/portifolio/releases/latest`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    )

    if (response.ok) {
      const release = await response.json()
      const result = { version: release.tag_name }
      setCached('version', result)
      return res.json(result)
    }

    // 2. Fallback: Se não houver release, busca o último commit
    const commitResponse = await githubFetch(
      `https://api.github.com/repos/${encodeURIComponent(config.username)}/portifolio/commits?per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    )

    if (commitResponse.ok) {
      const commits = await commitResponse.json()
      if (commits && commits.length > 0) {
        const sha = commits[0].sha.substring(0, 7)
        const result = { version: `sha-${sha}` }
        setCached('version', result)
        return res.json(result)
      }
    }

    const fallback = { version: 'v1.0.0' }
    setCached('version', fallback)
    res.json(fallback)
  } catch (err) {
    console.error('Erro ao buscar versão do portfólio:', err)
    res.json({ version: 'v1.0.0' })
  }
}

module.exports = { getRepos, getContributions, getLanguages, getPortfolioVersion }
