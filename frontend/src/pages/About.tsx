import { useState, useEffect } from 'react'
import { getGithubLanguages, getSettings } from '../services/api'

export default function About() {
  const [topLanguages, setTopLanguages] = useState<{name: string, percentage: number, color: string}[]>([])
  const [resumes, setResumes] = useState<{id: number, name: string, description?: string, url: string}[]>([])
  const [resumesDescription, setResumesDescription] = useState('')

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
            } catch(e) {}
          }
          if (data.resumes_description) {
            setResumesDescription(data.resumes_description)
          }
        }
      })
      .catch(console.error)
  }, [])
  const skills = {
    'Frontend': ['React', 'Vue.js', 'TypeScript', 'HTML', 'CSS', 'Tailwind'],
    'Backend': ['Node.js', 'Express', 'Python', 'Java'],
    'Banco de dados': ['MySQL', 'SQL'],
    'Ferramentas': ['Git', 'Node-RED', 'Make', 'Docker', 'WordPress'],
    'Infraestrutura': ['Ubuntu Server', 'Apache', 'PM2', 'Cloudflare'],
  }

  const experiences = [
    {
      role: 'Jovem Aprendiz',
      company: 'MTEC Energia',
      period: '2024 - 2025',
      description: 'Desenvolvimento de sistemas Full Stack, análise de dados, construção e manutenção de site.',
      techs: ['Node-RED', 'Vue.js', 'Node.js', 'MySQL', 'Wordpress', 'JavaScript', 'Elementor', 'Ubuntu Server', 'Cloudflare SSL' , 'Apache', 'PM2']
    },
    {
      role: 'Estagiário de TI',
      company: 'MTEC Energia',
      period: '2025 - Atualmente',
      description: 'Desenvolvimento de sistemas Full Stack, automações, análise de dados, suporte de TI, construção e manutenção de site.',
      techs: ['Node-RED', 'Vue.js', 'Node.js', 'MySQL', 'Make', 'Wordpress', 'JavaScript', 'Elementor', 'Ubuntu Server', 'Bitrix24 CRM', 'Apache', 'PM2']
    }
  ]

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Sobre mim</h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
          Estudante de Ciência da Computação na UDF, formando em dezembro de 2026.
          Atuo no desenvolvimento Full Stack desde 2024, com experiência prática em
          desenvolvimento de sistemas, automações e infraestrutura. Busco minha
          primeira oportunidade como desenvolvedor júnior ou melhor.
        </p>

        {/* Currículos em Destaque */}
        {resumes.length > 0 && (
          <div className="mt-12 pt-10 border-t border-gray-800/50">
            <h2 className="text-2xl font-bold mb-4">Currículos</h2>
            {resumesDescription && (
              <p className="text-gray-400 text-base leading-relaxed max-w-2xl mb-8">
                {resumesDescription}
              </p>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resumes.map(r => (
                <a 
                  key={r.id} 
                  href={r.url} 
                  target="_blank" 
                  className="group relative overflow-hidden bg-gray-900 hover:bg-teal-500/10 border border-gray-800 hover:border-teal-500/50 rounded-2xl p-5 flex items-center justify-between transition-all duration-300 shadow-lg hover:shadow-teal-500/10 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-800 group-hover:bg-teal-500/20 text-teal-400 w-12 h-12 rounded-xl flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-200 group-hover:text-white transition-colors">{r.name}</h3>
                      {r.description && <p className="text-sm text-gray-400 mt-1">{r.description}</p>}
                      <p className="text-xs text-teal-500/70 group-hover:text-teal-400 transition-colors mt-2">Clique para visualizar o PDF</p>
                    </div>
                  </div>
                  <div className="text-gray-600 group-hover:text-teal-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Experiência */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold mb-6">Experiência</h2>
        <div className="flex flex-col gap-4">
          {experiences.map((exp, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{exp.role}</h3>
                  <p className="text-teal-400 text-sm">{exp.company}</p>
                </div>
                <span className="text-gray-500 text-sm">{exp.period}</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{exp.description}</p>
              <div className="flex flex-wrap gap-2">
                {exp.techs.map(tech => (
                  <span key={tech} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold mb-6">Habilidades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(skills).map(([category, items]) => (
            <div key={category} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-sm font-medium text-teal-400 mb-3">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map(skill => (
                  <span key={skill} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Linguagens Mais Usadas */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold mb-6">Linguagens mais usadas (GitHub)</h2>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          {topLanguages.length === 0 ? (
            <p className="text-gray-400">Carregando...</p>
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
        <h2 className="text-2xl font-semibold mb-6">Educação</h2>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">Ciência da Computação</h3>
              <p className="text-teal-400 text-sm">Centro de Ensino Universitário do Distrito Federal (UDF)</p>
            </div>
            <span className="text-gray-500 text-sm">Conclusão prevista: 12/2026</span>
          </div>
        </div>  
      </section>

{/* Download currículo antigo foi movido para o Header com mais destaque */}

    </main>
  )
}