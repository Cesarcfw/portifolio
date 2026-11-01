import { getProjects, getGithubRepos } from '../services/api'
import { useResource } from '../hooks/useResource'
import ResourceStatus from '../components/ResourceStatus'
import LocalizedText from '../components/LocalizedText'
import { englishContent } from '../utils/contentTranslations'
import { useLanguage } from '../contexts/LanguageContext'

interface Project {
  id: number
  title: string
  title_en?: string
  description: string
  description_en?: string
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

function StatusBadge({ status, isEnglish }: { status: string; isEnglish: boolean }) {
  const map: Record<string, { label: string; className: string }> = {
    concluido:    { label: isEnglish ? 'Completed' : 'Concluído', className: 'bg-teal-500/10 border-teal-500/20 text-teal-400' },
    em_andamento: { label: isEnglish ? 'In progress' : 'Em andamento', className: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
    pausado:      { label: isEnglish ? 'Paused' : 'Pausado', className: 'bg-gray-500/10 border-gray-500/20 text-gray-400' },
  }
  const s = map[status] ?? map['concluido']
  return (
    <span className={`text-xs border px-2 py-0.5 rounded-full ${s.className}`}>
      {s.label}
    </span>
  )
}

export default function Projects() {
  const { isEnglish } = useLanguage()
  const projectResource = useResource<Project[]>(getProjects, [])
  const repoResource = useResource<Repo[]>(getGithubRepos, [])
  const { data: projects } = projectResource
  const { data: repos } = repoResource

  return (
    <main id="main-content" className="portfolio-page projects-page min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">{isEnglish ? 'Projects' : 'Projetos'}</h1>
        <p className="text-gray-400">{isEnglish ? 'Projects developed during internships, college, and independent work.' : 'Projetos desenvolvidos durante o estágio, na faculdade e por conta própria.'}</p>
      </section>

      {/* Projetos do banco */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold mb-6">{isEnglish ? 'Professional projects' : 'Projetos profissionais'}</h2>
        {projectResource.error ? <ResourceStatus {...projectResource} /> : projectResource.loading ? (
          <p className="text-gray-400">{isEnglish ? 'Loading...' : 'Carregando...'}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!projects.length && <ResourceStatus {...projectResource} empty />}
            {projects.map(project => (
              <div key={project.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-500 transition">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap min-w-0 items-center gap-2">
                    <h3 className="text-xl font-semibold"><LocalizedText original={project.title} english={project.title_en} /></h3>
                    <StatusBadge status={project.status} isEnglish={isEnglish} />
                  </div>
                  {project.featured && (
                    <span className="text-xs bg-blue-500/20 text-teal-400 px-2 py-1 rounded-full">
                      {isEnglish ? 'Featured' : 'Destaque'}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-4"><LocalizedText original={project.description} english={project.description_en} /></p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tech_stack?.map((tech: string) => (
                    <span key={tech} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4">
                  {project.github_url && (
                    <a href={project.github_url} target="_blank" rel="noreferrer" className="text-sm text-gray-400 hover:text-white transition">
                      GitHub →
                    </a>
                  )}
                  {project.live_url && (
                    <a href={project.live_url} target="_blank" rel="noreferrer" className="text-sm text-teal-400 hover:text-blue-300 transition">
                      {isEnglish ? 'View project' : 'Ver projeto'} →
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
        <h2 className="text-2xl font-semibold mb-6">{isEnglish ? 'GitHub repositories' : 'Repositórios no GitHub'}</h2>
        {repoResource.error ? <ResourceStatus {...repoResource} /> : repoResource.loading ? (
          <p className="text-gray-400">{isEnglish ? 'Loading...' : 'Carregando...'}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!repos.length && <ResourceStatus {...repoResource} empty />}
            {repos.map(repo => (
              <a key={repo.id} href={repo.url} target="_blank" rel="noreferrer"
                className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-blue-500 transition block">
                <h3 className="font-semibold mb-1">{repo.name}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {(isEnglish ? englishContent(repo.description) || repo.description : repo.description) || (isEnglish ? 'No description' : 'Sem descrição')}
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
