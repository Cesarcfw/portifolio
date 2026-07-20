import { useState, useEffect } from 'react'
import { getGithubLanguages, getSettings, getSkills, getExperiences } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

interface Skill {
  id: number
  name: string
  name_en?: string
  category: string
  category_en?: string
  level: number
  color: string
}

interface Experience {
  id?: number
  company: string
  company_en?: string
  role: string
  role_en?: string
  period: string
  period_en?: string
  description?: string
  description_en?: string
  techs?: string
  type: string
  order_index?: number
}

interface Resume {
  id: number
  pairId?: number
  order?: number
  name: string
  description?: string
  url: string
  language?: 'pt-BR' | 'en'
}

interface ResumePair {
  pairId: number
  order: number
  portuguese?: Resume
  english?: Resume
}

const getResumePairs = (resumes: Resume[]): ResumePair[] => {
  const pairs = new Map<number, ResumePair>()

  resumes.forEach((resume, index) => {
    const pairId = resume.pairId ?? resume.id
    const pair = pairs.get(pairId) || { pairId, order: resume.order ?? index }

    if ((resume.language || 'pt-BR') === 'en') pair.english = resume
    else pair.portuguese = resume

    pair.order = Math.min(pair.order, resume.order ?? index)
    pairs.set(pairId, pair)
  })

  return Array.from(pairs.values()).sort((a, b) => a.order - b.order)
}

const defaultSkills: Record<string, { name: string, color: string, level: number }[]> = {
  'Frontend': [
    { name: 'React', color: '#61dafb', level: 90 },
    { name: 'Vue.js', color: '#4fc08d', level: 85 },
    { name: 'TypeScript', color: '#3178c6', level: 85 },
    { name: 'HTML', color: '#e34c26', level: 95 },
    { name: 'CSS', color: '#264de4', level: 90 },
    { name: 'Tailwind', color: '#38bdf8', level: 90 }
  ],
  'Backend': [
    { name: 'Node.js', color: '#339933', level: 85 },
    { name: 'Express', color: '#828282', level: 85 },
    { name: 'Python', color: '#3776ab', level: 80 },
    { name: 'Java', color: '#007396', level: 70 }
  ],
  'Banco de dados': [
    { name: 'MySQL', color: '#00758f', level: 85 },
    { name: 'SQL', color: '#f29111', level: 85 }
  ],
  'Ferramentas': [
    { name: 'Git', color: '#f05032', level: 85 },
    { name: 'Node-RED', color: '#8f0000', level: 90 },
    { name: 'Make', color: '#6c63ff', level: 80 },
    { name: 'Docker', color: '#2496ed', level: 75 },
    { name: 'WordPress', color: '#21759b', level: 85 }
  ],
  'Infraestrutura': [
    { name: 'Ubuntu Server', color: '#e95420', level: 80 },
    { name: 'Apache', color: '#d22128', level: 75 },
    { name: 'PM2', color: '#2b037a', level: 80 },
    { name: 'Cloudflare', color: '#f38020', level: 80 }
  ],
}

const defaultExperiences: Experience[] = [
  {
    role: 'Jovem Aprendiz',
    role_en: 'Apprentice',
    company: 'MTEC Energia',
    company_en: 'MTEC Energia',
    period: '2024 - 2025',
    period_en: '2024 - 2025',
    description: 'Desenvolvimento de sistemas Full Stack, análise de dados, construção e manutenção de site.',
    description_en: 'Full Stack systems development, data analysis, website development, and maintenance.',
    techs: 'Node-RED, Vue.js, Node.js, MySQL, Wordpress, JavaScript, Elementor, Ubuntu Server, Cloudflare SSL, Apache, PM2',
    type: 'work'
  },
  {
    role: 'Estagiário de TI',
    role_en: 'IT Intern',
    company: 'MTEC Energia',
    company_en: 'MTEC Energia',
    period: '2025 - Atualmente',
    period_en: '2025 - Present',
    description: 'Desenvolvimento de sistemas Full Stack, automações, análise de dados, suporte de TI, construção e manutenção de site.',
    description_en: 'Full Stack systems development, automation, data analysis, IT support, website development, and maintenance.',
    techs: 'Node-RED, Vue.js, Node.js, MySQL, Make, Wordpress, JavaScript, Elementor, Ubuntu Server, Bitrix24 CRM, Apache, PM2',
    type: 'work'
  }
]

const defaultEducation: Experience[] = [
  {
    role: 'Ciência da Computação',
    role_en: 'Computer Science',
    company: 'Centro de Ensino Universitário do Distrito Federal (UDF)',
    company_en: 'University Education Center of the Federal District (UDF)',
    period: 'Conclusão prevista: 12/2026',
    period_en: 'Expected graduation: December 2026',
    description: '',
    type: 'education'
  }
]

export default function About() {
  const { isEnglish } = useLanguage()
  const [topLanguages, setTopLanguages] = useState<{name: string, percentage: number, color: string}[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [resumesDescription, setResumesDescription] = useState('')
  const [skills, setSkills] = useState<Skill[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])

  useEffect(() => {
    getGithubLanguages()
      .then(data => {
        if (Array.isArray(data)) {
          setTopLanguages(data.slice(0, 5))
        }
      })
      .catch(console.error)

    getSettings()
      .then(data => {
        if (data) {
          if (data.resumes_links) {
            try {
              setResumes(JSON.parse(data.resumes_links))
            } catch {
              setResumes([])
            }
          }
          setResumesDescription(isEnglish ? (data.resumes_description_en || '') : (data.resumes_description || ''))
        }
      })
      .catch(console.error)

    getSkills()
      .then(data => {
        if (Array.isArray(data)) {
          setSkills(data)
        }
      })
      .catch(console.error)

    getExperiences()
      .then(data => {
        if (Array.isArray(data)) {
          setExperiences(data)
        }
      })
      .catch(console.error)
  }, [isEnglish])

  // Helper for levels
  const getLevelLabel = (level: number) => {
    if (level >= 90) return isEnglish ? 'Advanced' : 'Avançado'
    if (level >= 70) return isEnglish ? 'Intermediate' : 'Intermediário'
    return isEnglish ? 'Beginner' : 'Iniciante'
  }

  // Group skills dynamically
  const displayedSkills: Record<string, { name: string, color: string, level: number }[]> = {}
  if (skills.length > 0) {
    skills.forEach(s => {
      const cat = isEnglish ? (s.category_en || s.category) : s.category
      if (!displayedSkills[cat]) {
        displayedSkills[cat] = []
      }
      displayedSkills[cat].push({ name: isEnglish ? (s.name_en || s.name) : s.name, color: s.color, level: s.level })
    })
  } else {
    const fallbackCategoryLabels: Record<string, string> = {
      'Banco de dados': 'Databases',
      'Ferramentas': 'Tools',
      'Infraestrutura': 'Infrastructure'
    }
    Object.entries(defaultSkills).forEach(([category, items]) => {
      displayedSkills[isEnglish ? (fallbackCategoryLabels[category] || category) : category] = items
    })
  }

  const workExperiences = experiences.length > 0
    ? experiences.filter(e => e.type === 'work')
    : defaultExperiences

  const educationExperiences = experiences.length > 0
    ? experiences.filter(e => e.type === 'education')
    : defaultEducation

  const resumePairs = getResumePairs(resumes)


  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">{isEnglish ? 'About me' : 'Sobre mim'}</h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
          {isEnglish
            ? 'Computer Science student at UDF, expected to graduate in December 2026. I have worked with Full Stack development since 2024, with practical experience in systems development, automation, and infrastructure. I am seeking an opportunity as a junior developer.'
            : 'Estudante de Ciência da Computação na UDF, com conclusão prevista para dezembro de 2026. Atuo no desenvolvimento Full Stack desde 2024, com experiência prática em desenvolvimento de sistemas, automações e infraestrutura. Busco uma oportunidade como desenvolvedor júnior.'}
        </p>

        {/* Currículos em Destaque */}
        {resumes.length > 0 && (
          <div id="curriculos" className="mt-12 pt-10 border-t border-gray-800/50">
            <h2 className="text-2xl font-bold mb-4">{isEnglish ? 'Résumés' : 'Currículos'}</h2>
            {resumesDescription && (
              <p className="text-gray-400 text-base leading-relaxed max-w-2xl mb-8">
                {resumesDescription}
              </p>
            )}
            
            <div className="flex flex-col gap-4">
              {resumePairs.map(pair => (
                <div key={pair.pairId} className="grid grid-cols-2 gap-4">
                  {[pair.portuguese, pair.english].filter((resume): resume is Resume => Boolean(resume)).map(resume => (
                <a 
                  key={resume.id}
                  href={resume.url}
                  target="_blank" 
                  rel="noreferrer"
                  className="group min-w-0 relative overflow-hidden bg-gray-900 hover:bg-teal-500/10 border border-gray-800 hover:border-teal-500/50 rounded-2xl p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all duration-300 shadow-lg hover:shadow-teal-500/10 hover:-translate-y-1"
                >
                  <div className="min-w-0 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="shrink-0 bg-gray-800 group-hover:bg-teal-500/20 text-teal-400 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base break-words text-gray-200 group-hover:text-white transition-colors">{resume.name}</h3>
                      <span className="inline-flex mt-1 text-[10px] uppercase tracking-wide bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">
                        {(resume.language || 'pt-BR') === 'en' ? (isEnglish ? 'English' : 'Inglês') : (isEnglish ? 'Portuguese (Brazil)' : 'Português (Brasil)')}
                      </span>
                      {resume.description && <p className="text-sm text-gray-400 mt-1">{resume.description}</p>}
                      <p className="text-xs text-teal-500/70 group-hover:text-teal-400 transition-colors mt-2">{isEnglish ? 'Click to view the PDF' : 'Clique para visualizar o PDF'}</p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-gray-600 group-hover:text-teal-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Experiência */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold mb-6">{isEnglish ? 'Experience' : 'Experiência'}</h2>
        <div className="flex flex-col gap-4">
          {workExperiences.map((exp, i) => {
            const techList = typeof exp.techs === 'string'
              ? exp.techs.split(',').map(t => t.trim()).filter(Boolean)
              : [];
            return (
              <div key={exp.id || i} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{isEnglish ? (exp.role_en || exp.role) : exp.role}</h3>
                    <p className="text-teal-400 text-sm">{isEnglish ? (exp.company_en || exp.company) : exp.company}</p>
                  </div>
                  <span className="text-gray-500 text-sm">{isEnglish ? (exp.period_en || exp.period) : exp.period}</span>
                </div>
                {(isEnglish ? (exp.description_en || exp.description) : exp.description) && <p className="text-gray-400 text-sm mb-4">{isEnglish ? (exp.description_en || exp.description) : exp.description}</p>}
                {techList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {techList.map(tech => (
                      <span key={tech} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Skills */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold mb-6">{isEnglish ? 'Skills' : 'Habilidades'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(displayedSkills).map(([category, items]) => (
            <div key={category} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-sm font-medium text-teal-400 mb-3">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map(skill => (
                  <span 
                    key={skill.name} 
                    title={`${isEnglish ? 'Level' : 'Nível'}: ${getLevelLabel(skill.level)}`}
                    className="bg-gray-800/50 border border-gray-700/60 text-gray-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 hover:border-teal-500/50 transition-colors duration-200 cursor-help"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: skill.color || '#00f0ff' }} />
                    {skill.name}
                    <span className="sr-only">({getLevelLabel(skill.level)})</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Linguagens Mais Usadas */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold mb-6">{isEnglish ? 'Most used languages (GitHub)' : 'Linguagens mais usadas (GitHub)'}</h2>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          {topLanguages.length === 0 ? (
            <p className="text-gray-400">{isEnglish ? 'Loading...' : 'Carregando...'}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {topLanguages.map(lang => (
                <div key={lang.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                      {lang.name}
                    </span>
                    <span className="text-gray-500">{lang.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Educação */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold mb-6">{isEnglish ? 'Education' : 'Educação'}</h2>
        <div className="flex flex-col gap-4">
          {educationExperiences.map((edu, i) => (
            <div key={edu.id || i} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{isEnglish ? (edu.role_en || edu.role) : edu.role}</h3>
                  <p className="text-teal-400 text-sm">{isEnglish ? (edu.company_en || edu.company) : edu.company}</p>
                </div>
                <span className="text-gray-500 text-sm">{isEnglish ? (edu.period_en || edu.period) : edu.period}</span>
              </div>
              {(isEnglish ? (edu.description_en || edu.description) : edu.description) && <p className="text-gray-400 text-sm mt-3">{isEnglish ? (edu.description_en || edu.description) : edu.description}</p>}
            </div>
          ))}
        </div>  
      </section>
    </main>
  )
}
