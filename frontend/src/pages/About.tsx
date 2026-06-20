import { useState, useEffect } from 'react'
import { getGithubLanguages, getSettings } from '../services/api'

export default function About() {
  const [topLanguages, setTopLanguages] = useState<{name: string, percentage: number, color: string}[]>([])
  const [resumes, setResumes] = useState<{id: number, name: string, url: string}[]>([])

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
        if (data && data.resumes_links) {
          try {
            setResumes(JSON.parse(data.resumes_links))
          } catch(e) {}
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

        {/* Botões de Currículo com grande destaque */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <h2 className="text-sm font-medium text-teal-400 uppercase tracking-widest mb-4">Download de Currículo</h2>
          <div className="flex flex-wrap gap-4">
            {resumes.length > 0 ? (
              resumes.map(r => (
                <a 
                  key={r.id} 
                  href={r.url} 
                  target="_blank" 
                  className="flex items-center gap-2 bg-gray-900/50 hover:bg-teal-500/10 border border-gray-700 hover:border-teal-500/50 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-teal-500/10 hover:scale-105"
                >
                  <span className="text-xl">📄</span> {r.name}
                </a>
              ))
            ) : (
              <a 
                href="/curriculo.pdf" 
                target="_blank" 
                className="flex items-center gap-2 bg-gray-900/50 hover:bg-teal-500/10 border border-gray-700 hover:border-teal-500/50 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-teal-500/10 hover:scale-105"
              >
                <span className="text-xl">📄</span> Baixar currículo geral
              </a>
            )}
          </div>
        </div>
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