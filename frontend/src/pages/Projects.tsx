import { useEffect, useState } from 'react'
import { getProjects, getGithubRepos } from '../services/api'

interface Project {
  id: number
  title: string
  description: string
  tech_stack: string[]
  github_url: string
  live_url: string
  featured: boolean
  status: string
}

interface Repo {
  id: number
  name: string
  description: string
  url: string
  language: string
  stars: number
  updatedAt: string
  version: string | null
  commits: number
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    concluido:    { label: 'Concluído',    className: 'bg-teal-500/10 border-teal-500/20 text-teal-400' },
    em_andamento: { label: 'Em andamento', className: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
    pausado:      { label: 'Pausado',      className: 'bg-gray-500/10 border-gray-500/20 text-gray-400' },
  }
  const s = map[status] ?? map['concluido']
  return (
    <span className={`text-xs border px-2 py-0.5 rounded-full ${s.className}`}>
      {s.label}
    </span>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [proj, rep] = await Promise.all([
          getProjects(),
          getGithubRepos()
        ])

        if (proj.error || rep.error) {
          throw new Error('API Error')
        }

        setProjects(proj || [])
        setRepos(rep || [])
      } catch (err) {
        console.error("Erro ao carregar projetos:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (error) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8 flex justify-center">
          {/* 
            ============== TROCAR A ANIMAÇÃO AQUI ==============
            Quando você quiser trocar a animação, basta alterar
            o link abaixo dentro do 'src="..."' pelo link da sua imagem.
            ====================================================
          */}
          <img 
            src="https://media.tenor.com/lcDEp7V0E6wAAAAC/cryptoadz-coffee-time.gif" 
            alt="Servidor Acordando" 
            className="w-32 h-32 rounded-xl object-cover shadow-lg pixelated"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Estamos acordando o servidor...
        </h1>
        
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
          O primeiro acesso do dia leva cerca de <strong>50 segundos</strong>, pois nosso servidor estava em modo de economia de energia. Ele já está preparando o café!
        </p>
        
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 hover:bg-blue-600 px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
        >
          Tentar novamente
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Projetos</h1>
        <p className="text-gray-400">Projetos desenvolvidos durante o estágio, na faculdade e por conta própria.</p>
      </section>

      {/* Projetos do banco */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold mb-6">Projetos profissionais</h2>
        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map(project => (
              <div key={project.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-500 transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                  {project.featured && (
                    <span className="text-xs bg-blue-500/20 text-teal-400 px-2 py-1 rounded-full">
                      Destaque
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tech_stack?.map((tech: string) => (
                    <span key={tech} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4">
                  {project.github_url && (
                    <a href={project.github_url} target="_blank" className="text-sm text-gray-400 hover:text-white transition">
                      GitHub →
                    </a>
                  )}
                  {project.live_url && (
                    <a href={project.live_url} target="_blank" className="text-sm text-teal-400 hover:text-blue-300 transition">
                      Ver projeto →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Repositórios do GitHub */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold mb-6">Repositórios no GitHub</h2>
        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map(repo => (
              <a key={repo.id} href={repo.url} target="_blank"
                className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-blue-500 transition block">
                <h3 className="font-semibold mb-1">{repo.name}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {repo.description || 'Sem descrição'}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {repo.language && <span>⚡ {repo.language}</span>}
                  <span>⭐ {repo.stars}</span>
                  {repo.commits > 0 && (
                    <span>💻 {repo.commits} commits</span>
                  )}
                  {repo.version && (
                    <span className="ml-auto bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">
                      {repo.version}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

    </main>
  )
}