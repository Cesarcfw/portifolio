import { useState } from 'react'
import { getFeaturedProjects, getGithubRepos, getGithubContributions, getSettings } from '../services/api'
import { useResource } from '../hooks/useResource'
import ResourceStatus from '../components/ResourceStatus'
import LocalizedText from '../components/LocalizedText'
import { statusEnglish } from '../utils/statusTranslations'
import { englishContent } from '../utils/contentTranslations'
import { useLanguage } from '../contexts/LanguageContext'
import WorkspaceScene from '../components/WorkspaceScene'

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
  version: string | null
  commits: number
}

interface ContributionDay {
  contributionCount: number
  date: string
  color: string
}

interface ContributionWeek {
  contributionDays: ContributionDay[]
}

interface ContributionData {
  total: number
  weeks: ContributionWeek[]
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

export default function Home() {
  const { language, isEnglish } = useLanguage()
  const projectResource = useResource<Project[]>(getFeaturedProjects, [])
  const repoResource = useResource<Repo[]>(getGithubRepos, [])
  const contributionResource = useResource<ContributionData | null>(getGithubContributions, null)
  const settingsResource = useResource<Record<string, string>>(getSettings, {})
  const { data: projects, loading } = projectResource
  const { data: repos } = repoResource
  const { data: contributions } = contributionResource
  const { data: settings } = settingsResource
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null)
  const [focusedDay, setFocusedDay] = useState(0)
  const availabilityReference = settings.availability_text || ''

  // Helpers para o gráfico de contribuições
  function getContributionColor(count: number): string {
    if (count === 0) return 'bg-gray-800/50'
    if (count <= 2) return 'bg-teal-900/60'
    if (count <= 5) return 'bg-teal-700/70'
    if (count <= 8) return 'bg-teal-500'
    return 'bg-teal-400'
  }

  function getMonthLabels(weeks: ContributionWeek[]): { label: string; index: number }[] {
    const months: { label: string; index: number }[] = []
    const monthNames = isEnglish
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    let lastMonth = -1
    weeks.forEach((week, i) => {
      const firstDay = week.contributionDays[0]
      if (firstDay) {
        const month = new Date(firstDay.date + 'T00:00:00').getMonth()
        if (month !== lastMonth) {
          months.push({ label: monthNames[month], index: i })
          lastMonth = month
        }
      }
    })
    return months
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <main id="main-content" className="portfolio-page home-page min-h-screen bg-gray-950 text-white">

      {/* Hero */}
<section className="portfolio-hero">
  <div className="hero-copy">
    <h1 className="hero-title">
      {isEnglish ? 'Hi, I am' : 'Olá, eu sou'}<br />César<span className="hero-period">.</span>
    </h1>
    <p className="hero-role">{isEnglish ? 'Backend / Full Stack Developer' : 'Desenvolvedor Backend / Full Stack'}</p>
    <p className="hero-description">
      {(isEnglish ? settings.about_me_text_en : settings.about_me_text) || (
        isEnglish ? 'I build APIs, integrations, and web applications, with a backend focus and experience building user interfaces.' : 'Desenvolvo APIs, integrações e aplicações web, com foco em backend e experiência na construção de interfaces.'
      )}
    </p>
    <div className="hero-statuses flex flex-wrap gap-3 mb-8">
      {settings.availability_text && (
        <div className={`inline-flex items-center gap-2 border text-sm px-4 py-2 rounded-full ${
          availabilityReference.includes('Agora') ? 'bg-green-500/10 border-green-500/20 text-green-400' :
          availabilityReference.includes('propostas') ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
          'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            availabilityReference.includes('Agora') ? 'bg-green-400' :
            availabilityReference.includes('propostas') ? 'bg-yellow-400' :
            'bg-red-400'
          }`} />
          <LocalizedText original={settings.availability_text} english={settings.availability_text_en || statusEnglish(settings.availability_text)} />
        </div>
      )}
      {settings.job_status_text && (
        <div className="inline-flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 text-gray-300 text-sm px-4 py-2 rounded-full">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 7V4h8v3M4 7h16v13H4zM4 12h16M10 12v3h4v-3" /></svg>
          {isEnglish ? 'Current status' : 'Status atual'}: <LocalizedText original={settings.job_status_text.replace('Status atual: ', '')} english={settings.job_status_text_en || statusEnglish(settings.job_status_text)} />
        </div>
      )}
    </div>

    <div className="hero-technologies" aria-label={isEnglish ? 'Technologies' : 'Tecnologias'}>
      {['Node.js', 'MySQL', 'Node-RED', 'React', 'Vue.js'].map(technology => <span key={technology}>{technology}</span>)}
    </div>

    <div className="hero-actions">
      <a href="/projetos"
        className="portfolio-button">
        {isEnglish ? 'View projects' : 'Ver projetos'}
      </a>
      <a href="/sobre#curriculos"
        className="portfolio-link">
        {isEnglish ? 'Résumés' : 'Currículos'}
      </a>
      <a href="/sobre"
        className="portfolio-link">
        {isEnglish ? 'About me' : 'Sobre mim'}
      </a>
    </div>
  </div>
  <WorkspaceScene isEnglish={isEnglish} />
</section>
{settingsResource.error && <div className="max-w-5xl mx-auto px-6"><ResourceStatus {...settingsResource} /></div>}

{/* Projetos em destaque */}
<section className="max-w-5xl mx-auto px-6 py-16">
  <h2 className="text-3xl font-bold mb-10">{isEnglish ? 'Featured projects' : 'Projetos em destaque'}</h2>

  {projectResource.error ? <ResourceStatus {...projectResource} /> : loading ? (
    <p className="text-gray-400">{isEnglish ? 'Loading...' : 'Carregando...'}</p>
  ) : projects.length === 0 ? (
    <p className="text-gray-400">{isEnglish ? 'No featured projects yet.' : 'Nenhum projeto em destaque ainda.'}</p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {projects.map(project => (
        <div key={project.id}
          className="featured-project group relative p-6">

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold group-hover:text-teal-400 transition-colors">
                  <LocalizedText original={project.title} english={project.title_en} />
                </h3>
                <StatusBadge status={project.status} isEnglish={isEnglish} />
              </div>
              <div className="project-actions flex gap-3">
                {project.github_url && (
                  <a href={project.github_url} target="_blank" rel="noreferrer"
                    className="text-gray-400 hover:text-white text-xs transition">
                    GitHub
                  </a>
                )}
                {project.live_url && (
                  <a href={project.live_url} target="_blank" rel="noreferrer"
                    className="text-teal-400 hover:text-blue-300 text-xs transition">
                    Live →
                  </a>
                )}
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-5 leading-relaxed"><LocalizedText original={project.description} english={project.description_en} /></p>

            <div className="flex flex-wrap gap-2">
              {project.tech_stack?.map((tech: string) => (
                <span key={tech}
                  className="bg-blue-500/10 border border-blue-500/20 text-teal-400 text-xs px-3 py-1 rounded-full">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )}

  <div className="mt-8">
    <a href="/projetos" className="text-sm text-gray-400 hover:text-teal-400 transition-colors">
      {isEnglish ? 'View all projects' : 'Ver todos os projetos'} →
    </a>
  </div>
</section>

{/* Gráfico de Contribuições GitHub */}
{!contributions && <section className="max-w-5xl mx-auto px-6 py-16">
  <h2>{isEnglish ? 'GitHub activity' : 'Atividade no GitHub'}</h2>
  <ResourceStatus {...contributionResource} empty />
</section>}
{contributions && (
<section className="max-w-5xl mx-auto px-6 py-16">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
    <h2 className="text-2xl sm:text-3xl font-bold">
      <span className="contribution-total">{contributions.total}</span>{' '}
      {isEnglish ? 'contributions in the last year' : 'contribuições no último ano'}
    </h2>
    <a href={settings.github_url || "https://github.com/Cesarcfw"} target="_blank" rel="noreferrer"
      className="text-sm text-gray-400 hover:text-teal-400 transition-colors">
      {isEnglish ? 'View profile' : 'Ver perfil'} →
    </a>
  </div>

  <div data-contribution-chart className="bg-gray-900/50 rounded-2xl p-4 sm:p-6 border border-gray-800">

    {/* Grid com scroll horizontal no mobile */}
    <div className="overflow-x-auto">
      <div style={{ minWidth: '780px' }}>
        {/* Labels dos meses */}
        <div className="flex pl-8 mb-1 relative h-5">
          {getMonthLabels(contributions.weeks).map((m, i) => (
            <span
              key={i}
              className="text-[10px] sm:text-xs text-gray-500 absolute"
              style={{ left: `calc(${m.index} * (var(--day-size, 12px) + 3px) + 32px)` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div data-contribution-grid className="flex gap-[3px]">
          {/* Labels dos dias */}
          <div className="flex flex-col gap-[3px] mr-1 shrink-0">
            <div className="h-[12px]" />
            <div className="h-[12px] flex items-center"><span className="text-[9px] text-gray-500 w-6">{isEnglish ? 'Mon' : 'Seg'}</span></div>
            <div className="h-[12px]" />
            <div className="h-[12px] flex items-center"><span className="text-[9px] text-gray-500 w-6">{isEnglish ? 'Wed' : 'Qua'}</span></div>
            <div className="h-[12px]" />
            <div className="h-[12px] flex items-center"><span className="text-[9px] text-gray-500 w-6">{isEnglish ? 'Fri' : 'Sex'}</span></div>
            <div className="h-[12px]" />
          </div>

          {/* Colunas de semanas */}
          {contributions.weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.contributionDays.map((day, di) => (
                <button type="button"
                  key={di}
                  data-contribution-day
                  tabIndex={focusedDay === contributions.weeks.slice(0, wi).reduce((sum, w) => sum + w.contributionDays.length, 0) + di ? 0 : -1}
                  onKeyDown={event => {
                    const buttons = Array.from(event.currentTarget.closest('[data-contribution-chart]')?.querySelectorAll<HTMLButtonElement>('[data-contribution-day]') || [])
                    const index = buttons.indexOf(event.currentTarget)
                    const delta: Record<string, number> = { ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 }
                    if (!(event.key in delta) && event.key !== 'Home' && event.key !== 'End') return
                    event.preventDefault()
                    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + delta[event.key]))
                    setFocusedDay(next)
                    buttons[next]?.focus()
                  }}
                  aria-label={`${day.contributionCount} ${isEnglish ? 'contributions' : 'contribuições'}: ${formatDate(day.date)}`}
                  className={`w-[12px] h-[12px] rounded-sm ${getContributionColor(day.contributionCount)} hover:ring-1 hover:ring-teal-400/50 hover:scale-150 transition-transform duration-100 cursor-pointer`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => setHoveredDay(day)}
                  onFocus={event => {
                    setHoveredDay(day)
                    const buttons = Array.from(event.currentTarget.closest('[data-contribution-chart]')?.querySelectorAll('[data-contribution-day]') || [])
                    setFocusedDay(buttons.indexOf(event.currentTarget))
                  }}
                  onBlur={() => setHoveredDay(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Barra de info + legenda */}
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-gray-800 pt-4">
      <div className="text-xs text-gray-400 min-h-5" aria-live="polite" aria-atomic="true">
        {hoveredDay ? (
          <>
            <span className="font-semibold text-teal-400">{hoveredDay.contributionCount} {isEnglish ? 'contributions' : 'contribuições'}</span>
            {' '}{isEnglish ? 'on' : 'em'} {formatDate(hoveredDay.date)}
          </>
        ) : (
          <span className="text-gray-600">{isEnglish ? 'Select a day. Use arrow keys to move through the chart.' : 'Selecione um dia. Use as setas do teclado para navegar no calendário.'}</span>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500">{isEnglish ? 'Less' : 'Menos'}</span>
        <div className="w-[12px] h-[12px] rounded-sm bg-gray-800/50" />
        <div className="w-[12px] h-[12px] rounded-sm bg-teal-900/60" />
        <div className="w-[12px] h-[12px] rounded-sm bg-teal-700/70" />
        <div className="w-[12px] h-[12px] rounded-sm bg-teal-500" />
        <div className="w-[12px] h-[12px] rounded-sm bg-teal-400" />
        <span className="text-[10px] text-gray-500">{isEnglish ? 'More' : 'Mais'}</span>
      </div>
    </div>
  </div>
</section>
)}

      {/* Repositórios do GitHub */}
<section className="max-w-5xl mx-auto px-6 py-16">
  <div className="flex items-center justify-between mb-10">
    <h2 className="text-3xl font-bold">{isEnglish ? 'Repositories' : 'Repositórios'}</h2>
    <a href={settings.github_url || "https://github.com/Cesarcfw"} target="_blank" rel="noreferrer"
      className="text-sm text-gray-400 hover:text-teal-400 transition-colors">
      {isEnglish ? 'View all' : 'Ver todos'} →
    </a>
  </div>

  {repoResource.error ? <ResourceStatus {...repoResource} /> : repoResource.loading ? (
    <p className="text-gray-400">{isEnglish ? 'Loading...' : 'Carregando...'}</p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {!repos.length && <ResourceStatus {...repoResource} empty />}
      {repos.slice(0, 6).map(repo => (
        <a key={repo.id} href={repo.url} target="_blank" rel="noreferrer"
          className="repository-card group p-5 block">
          
          <div className="flex items-start justify-between mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 4h6l2 3h8v13H4z" /></svg>
            <svg className="repository-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg>
          </div>

          <h3 className="font-semibold mb-1 group-hover:text-teal-400 transition-colors">
            {repo.name}
          </h3>
          <p className="text-gray-500 text-xs mb-4 line-clamp-2">
            {(isEnglish ? englishContent(repo.description) || repo.description : repo.description) || (isEnglish ? 'No description' : 'Sem descrição')}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            {repo.language && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-teal-400 rounded-full" />
                {repo.language}
              </span>
            )}
            <span className="inline-flex items-center gap-1" aria-label={`${repo.stars} ${isEnglish ? 'stars' : 'estrelas'}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" /></svg>{repo.stars}</span>
            {repo.commits > 0 && (
              <span className="flex items-center gap-1">
                {repo.commits} commits
              </span>
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

      <section className="home-contact max-w-5xl mx-auto px-6 py-16">
        <h2>{isEnglish ? 'Shall we talk?' : 'Vamos conversar?'}</h2>
        <div><p>{isEnglish ? 'For opportunities, projects, or exchanging ideas.' : 'Para oportunidades, projetos ou uma troca de ideias.'}</p>
          <a className="portfolio-button" href="/contato">{isEnglish ? 'Get in touch' : 'Entrar em contato'}</a></div>
      </section>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-gray-900 flex justify-between items-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} César. {isEnglish ? 'All rights reserved.' : 'Todos os direitos reservados.'}</p>
      </footer>

    </main>
  )
}
