import { useEffect, useState } from 'react'
import { getFeaturedProjects, getGithubRepos, getGithubContributions, getSettings } from '../services/api'

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

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [repos, setRepos] = useState<Repo[]>([])
  const [contributions, setContributions] = useState<ContributionData | null>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [proj, rep, contrib, sets] = await Promise.all([
          getFeaturedProjects(),
          getGithubRepos(),
          getGithubContributions().catch(() => null),
          getSettings().catch(() => ({}))
        ])

        // Verifica se a API retornou erro (ex: banco fora do ar)
        if (proj.error || rep.error) {
          throw new Error('API Error')
        }

        setProjects(proj || [])
        setRepos(rep || [])
        setContributions(contrib)
        setSettings(sets || {})
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        window.location.reload()
      }, 50000)
      return () => clearTimeout(timer)
    }
  }, [error])

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
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    let lastMonth = -1
    weeks.forEach((week, i) => {
      const firstDay = week.contributionDays[0]
      if (firstDay) {
        const month = new Date(firstDay.date).getMonth()
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
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Hero */}
<section className="relative flex flex-col items-center justify-center text-center px-6 py-20 sm:py-40 overflow-hidden">
  
  {/* Grid de fundo */}
  <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
  
  {/* Brilho central */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

  {/* Conteúdo */}
  <div className="relative z-10">
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      {settings.availability_text && (
        <div className={`inline-flex items-center gap-2 border text-sm px-4 py-2 rounded-full ${
          settings.availability_text.includes('Agora') ? 'bg-green-500/10 border-green-500/20 text-green-400' :
          settings.availability_text.includes('propostas') ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
          'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            settings.availability_text.includes('Agora') ? 'bg-green-400 animate-pulse' :
            settings.availability_text.includes('propostas') ? 'bg-yellow-400' :
            'bg-red-400'
          }`} />
          {settings.availability_text}
        </div>
      )}
      {settings.job_status_text && (
        <div className="inline-flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 text-gray-300 text-sm px-4 py-2 rounded-full">
          <span className="text-xl">💼</span>
          Status atual: {settings.job_status_text.replace('Status atual: ', '')}
        </div>
      )}
    </div>

    <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
      Olá, eu sou{' '}
      <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
        César
      </span>
    </h1>

    <p className="text-base sm:text-xl text-gray-400 max-w-xl mx-auto mb-4">
      Desenvolvedor{' '}
      <span className="text-white font-medium">Full Stack</span>
      {' '}focado em automação, sistemas e experiências digitais eficientes.
    </p>

    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-10">
      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
      Node.js · Vue.js · React · MySQL · Node-RED
    </div>

    <div className="flex flex-wrap gap-4 justify-center">
      <a href="/projetos"
        className="relative bg-blue-500 hover:bg-teal-400 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">
        Ver projetos
      </a>
      <a href="/sobre#curriculos"
        className="relative bg-teal-500 hover:bg-blue-500 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-blue-500/40">
        Currículos
      </a>
      <a href="/sobre"
        className="relative border border-gray-700 hover:border-blue-500/50 bg-gray-900/50 backdrop-blur-sm px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:text-teal-400">
        Sobre mim
      </a>
    </div>
  </div>
</section>

{/* Projetos em destaque */}
<section className="max-w-5xl mx-auto px-6 py-16">
  <div className="flex items-center gap-3 mb-8">
    <div className="w-8 h-px bg-blue-500" />
    <h2 className="text-sm font-medium text-teal-400 uppercase tracking-widest">Projetos</h2>
  </div>
  <h2 className="text-3xl font-bold mb-10">Projetos em destaque</h2>

  {loading ? (
    <p className="text-gray-400">Carregando...</p>
  ) : projects.length === 0 ? (
    <p className="text-gray-400">Nenhum projeto em destaque ainda.</p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {projects.map(project => (
        <div key={project.id}
          className="group relative bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
          
          {/* Brilho no hover */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold group-hover:text-teal-400 transition-colors">
                  {project.title}
                </h3>
                <StatusBadge status={project.status} />
              </div>
              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                {project.github_url && (
                  <a href={project.github_url} target="_blank"
                    className="text-gray-400 hover:text-white text-xs transition">
                    GitHub
                  </a>
                )}
                {project.live_url && (
                  <a href={project.live_url} target="_blank"
                    className="text-teal-400 hover:text-blue-300 text-xs transition">
                    Live →
                  </a>
                )}
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-5 leading-relaxed">{project.description}</p>

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
      Ver todos os projetos →
    </a>
  </div>
</section>

{/* Gráfico de Contribuições GitHub */}
{contributions && (
<section className="max-w-5xl mx-auto px-6 py-16">
  <div className="flex items-center gap-3 mb-8">
    <div className="w-8 h-px bg-blue-500" />
    <h2 className="text-sm font-medium text-teal-400 uppercase tracking-widest">Atividade</h2>
  </div>
  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
    <h2 className="text-2xl sm:text-3xl font-bold">
      <span className="bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">{contributions.total}</span>{' '}
      contribuições no último ano
    </h2>
    <a href="https://github.com/Cesarcfw" target="_blank"
      className="text-sm text-gray-400 hover:text-teal-400 transition-colors">
      Ver perfil →
    </a>
  </div>

  <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-800">

    {/* Grid com scroll horizontal no mobile */}
    <div className="overflow-x-auto">
      <div style={{ minWidth: '780px' }}>
        {/* Labels dos meses */}
        <div className="flex pl-8 mb-1 relative h-5">
          {getMonthLabels(contributions.weeks).map((m, i) => (
            <span
              key={i}
              className="text-[10px] sm:text-xs text-gray-500 absolute"
              style={{ left: `${m.index * 15 + 32}px` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[3px]">
          {/* Labels dos dias */}
          <div className="flex flex-col gap-[3px] mr-1 shrink-0">
            <div className="h-[12px]" />
            <div className="h-[12px] flex items-center"><span className="text-[9px] text-gray-500 w-6">Seg</span></div>
            <div className="h-[12px]" />
            <div className="h-[12px] flex items-center"><span className="text-[9px] text-gray-500 w-6">Qua</span></div>
            <div className="h-[12px]" />
            <div className="h-[12px] flex items-center"><span className="text-[9px] text-gray-500 w-6">Sex</span></div>
            <div className="h-[12px]" />
          </div>

          {/* Colunas de semanas */}
          {contributions.weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.contributionDays.map((day, di) => (
                <div
                  key={di}
                  className={`w-[12px] h-[12px] rounded-sm ${getContributionColor(day.contributionCount)} hover:ring-1 hover:ring-teal-400/50 hover:scale-150 transition-transform duration-100 cursor-pointer`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onTouchStart={() => setHoveredDay(day)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Barra de info + legenda */}
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-gray-800 pt-4">
      <div className="text-xs text-gray-400 h-5">
        {hoveredDay ? (
          <>
            <span className="font-semibold text-teal-400">{hoveredDay.contributionCount} contribuições</span>
            {' '}em {formatDate(hoveredDay.date)}
          </>
        ) : (
          <span className="text-gray-600">Passe o mouse sobre o gráfico para ver detalhes</span>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500">Menos</span>
        <div className="w-[12px] h-[12px] rounded-sm bg-gray-800/50" />
        <div className="w-[12px] h-[12px] rounded-sm bg-teal-900/60" />
        <div className="w-[12px] h-[12px] rounded-sm bg-teal-700/70" />
        <div className="w-[12px] h-[12px] rounded-sm bg-teal-500" />
        <div className="w-[12px] h-[12px] rounded-sm bg-teal-400" />
        <span className="text-[10px] text-gray-500">Mais</span>
      </div>
    </div>
  </div>
</section>
)}

      {/* Repositórios do GitHub */}
<section className="max-w-5xl mx-auto px-6 py-16">
  <div className="flex items-center gap-3 mb-8">
    <div className="w-8 h-px bg-blue-500" />
    <h2 className="text-sm font-medium text-teal-400 uppercase tracking-widest">GitHub</h2>
  </div>
  <div className="flex items-center justify-between mb-10">
    <h2 className="text-3xl font-bold">Repositórios</h2>
    <a href="https://github.com/Cesarcfw" target="_blank"
      className="text-sm text-gray-400 hover:text-teal-400 transition-colors">
      Ver todos →
    </a>
  </div>

  {loading ? (
    <p className="text-gray-400">Carregando...</p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {repos.slice(0, 6).map(repo => (
        <a key={repo.id} href={repo.url} target="_blank"
          className="group bg-gray-900/50 rounded-xl p-5 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 block hover:shadow-lg hover:shadow-blue-500/5">
          
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-sm group-hover:bg-blue-500/20 transition-colors">
              {'</>'}
            </div>
            <span className="text-gray-600 group-hover:text-teal-400 transition-colors text-lg">↗</span>
          </div>

          <h3 className="font-semibold mb-1 group-hover:text-teal-400 transition-colors">
            {repo.name}
          </h3>
          <p className="text-gray-500 text-xs mb-4 line-clamp-2">
            {repo.description || 'Sem descrição'}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            {repo.language && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-teal-400 rounded-full" />
                {repo.language}
              </span>
            )}
            <span>⭐ {repo.stars}</span>
            {repo.commits > 0 && (
              <span className="flex items-center gap-1">
                💻 {repo.commits} commits
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

    </main>
  )
}