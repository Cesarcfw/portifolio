import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useResource } from '../hooks/useResource'
import ResourceStatus from '../components/ResourceStatus'
import LocalizedText from '../components/LocalizedText'
import { englishContent } from '../utils/contentTranslations'
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

async function loadResumeSettings() {
  const data = await getSettings()
  const resumes = JSON.parse(data.resumes_links || '[]') as Resume[]
  if (!Array.isArray(resumes)) throw new Error('Invalid résumé list')
  return { ...data, resumes }
}

export default function About() {
  const { isEnglish } = useLanguage()
  const location = useLocation()
  const languagesResource = useResource<{name: string, percentage: number, color: string}[]>(getGithubLanguages, [])
  const resumeResource = useResource(loadResumeSettings, { resumes: [] as Resume[], resumes_description: '', resumes_description_en: '' })
  const skillsResource = useResource<Skill[]>(getSkills, [])
  const experiencesResource = useResource<Experience[]>(getExperiences, [])
  const topLanguages = languagesResource.data.slice(0, 5)
  const { resumes, resumes_description: resumesDescription, resumes_description_en: resumesDescriptionEn } = resumeResource.data
  const skills = skillsResource.data
  const experiences = experiencesResource.data

  useEffect(() => {
    if (location.hash !== '#curriculos') return
    const frame = requestAnimationFrame(() => document.getElementById('curriculos')?.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [location.hash, resumeResource.loading])

  // Helper for levels
  const getLevelLabel = (level: number) => {
    if (level >= 90) return isEnglish ? 'Advanced' : 'Avançado'
    if (level >= 70) return isEnglish ? 'Intermediate' : 'Intermediário'
    return isEnglish ? 'Beginner' : 'Iniciante'
  }

  // Group skills dynamically
  const displayedSkills: Record<string, { name: string, english?: string, color: string, level: number }[]> = {}
  if (skills.length > 0) {
    skills.forEach(s => {
      const cat = isEnglish ? (englishContent(s.category, s.category_en) || 'Other skills — translation pending') : s.category
      if (!displayedSkills[cat]) {
        displayedSkills[cat] = []
      }
      displayedSkills[cat].push({ name: s.name, english: s.name_en, color: s.color, level: s.level })
    })
  }

  const workExperiences = experiences.filter(e => e.type === 'work')
  const educationExperiences = experiences.filter(e => e.type === 'education')

  const resumePairs = getResumePairs(resumes)


  return (
    <main id="main-content" className="portfolio-page about-page min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">{isEnglish ? 'About me' : 'Sobre mim'}</h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
          {isEnglish
            ? 'Computer Science student at UDF, expected to graduate in December 2026. I have worked in systems development since 2024, with practical experience in Full Stack applications, automation, and infrastructure. My focus is backend development: APIs, integrations, authentication, and databases, alongside building web interfaces. I am seeking a junior Backend or Full Stack developer opportunity.'
            : 'Estudante de Ciência da Computação na UDF, com conclusão prevista para dezembro de 2026. Atuo no desenvolvimento de sistemas desde 2024, com experiência prática em aplicações Full Stack, automações e infraestrutura. Meu foco é backend: APIs, integrações, autenticação e bancos de dados, sem deixar de atuar na construção de interfaces web. Busco uma oportunidade como desenvolvedor Backend ou Full Stack Júnior.'}
        </p>

        {/* Currículos em Destaque */}
          <div id="curriculos" tabIndex={-1} className="mt-12 pt-10 border-t border-gray-800/50">
            <h2 className="text-2xl font-bold mb-4">{isEnglish ? 'Résumés' : 'Currículos'}</h2>
            <ResourceStatus {...resumeResource} empty={!resumes.length} />
            {resumesDescription && (
              <p className="text-gray-400 text-base leading-relaxed max-w-2xl mb-8">
                <LocalizedText original={resumesDescription} english={resumesDescriptionEn} />
              </p>
            )}
            
            <div className="flex flex-col gap-4">
              {resumePairs.map(pair => (
                <div key={pair.pairId} className="resume-pair grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <h3 lang={isEnglish && englishContent(resume.name) ? 'en' : resume.language || 'pt-BR'} className="font-semibold text-sm sm:text-base break-words text-gray-200 group-hover:text-white transition-colors">{isEnglish ? englishContent(resume.name) || resume.name : resume.name}</h3>
                      <span className="inline-flex mt-1 text-[10px] uppercase tracking-wide bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">
                        {(resume.language || 'pt-BR') === 'en' ? (isEnglish ? 'English' : 'Inglês') : (isEnglish ? 'Portuguese (Brazil)' : 'Português (Brasil)')}
                      </span>
                      {resume.description && <p lang={isEnglish && englishContent(resume.description) ? 'en' : resume.language || 'pt-BR'} className="text-sm text-gray-400 mt-1">{isEnglish ? englishContent(resume.description) || resume.description : resume.description}</p>}
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
      </section>

      {/* Experiência */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold mb-6">{isEnglish ? 'Experience' : 'Experiência'}</h2>
        <ResourceStatus {...experiencesResource} empty={!workExperiences.length} />
        <div className="flex flex-col gap-4">
          {workExperiences.map((exp, i) => {
            const techList = typeof exp.techs === 'string'
              ? exp.techs.split(',').map(t => t.trim()).filter(Boolean)
              : [];
            return (
              <div key={exp.id || i} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold"><LocalizedText original={exp.role} english={exp.role_en} /></h3>
                    <p className="text-teal-400 text-sm">{isEnglish ? (englishContent(exp.company, exp.company_en) || exp.company) : exp.company}</p>
                  </div>
                  <span className="text-gray-500 text-sm"><LocalizedText original={exp.period} english={exp.period_en} /></span>
                </div>
                {exp.description && <p className="text-gray-400 text-sm mb-4"><LocalizedText original={exp.description} english={exp.description_en} /></p>}
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
        <ResourceStatus {...skillsResource} empty={!skills.length} />
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
                    <LocalizedText original={skill.name} english={skill.english} />
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
          {languagesResource.loading || languagesResource.error || topLanguages.length === 0 ? (
            <ResourceStatus {...languagesResource} empty />
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
        <ResourceStatus {...experiencesResource} empty={!educationExperiences.length} />
        <div className="flex flex-col gap-4">
          {educationExperiences.map((edu, i) => (
            <div key={edu.id || i} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold"><LocalizedText original={edu.role} english={edu.role_en} /></h3>
                  <p className="text-teal-400 text-sm">{isEnglish ? (englishContent(edu.company, edu.company_en) || edu.company) : edu.company}</p>
                </div>
                <span className="text-gray-500 text-sm"><LocalizedText original={edu.period} english={edu.period_en} /></span>
              </div>
              {edu.description && <p className="text-gray-400 text-sm mt-3"><LocalizedText original={edu.description} english={edu.description_en} /></p>}
            </div>
          ))}
        </div>  
      </section>
    </main>
  )
}
