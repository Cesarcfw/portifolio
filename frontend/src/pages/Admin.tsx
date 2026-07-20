import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  login as loginApi, 
  getProjects, 
  forgotPassword, 
  getSettings, 
  updateSettings, 
  uploadResume, 
  removeResume, 
  editResume,
  getSkills,
  createSkill,
  updateSkill,
  removeSkill,
  getExperiences,
  createExperience,
  updateExperience,
  removeExperience
} from '../services/api'

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

interface Skill {
  id: number
  name: string
  category: string
  level: number
  color: string
}

interface Experience {
  id?: number
  company: string
  role: string
  period: string
  description?: string
  techs?: string
  type: string
  order_index?: number
}

interface Resume {
  id: number
  name: string
  description?: string
  url: string
  language?: 'pt-BR' | 'en'
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Admin() {
  const { isAuthenticated, token, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'projects' | 'resumes' | 'skills' | 'experiences' | 'settings'>('projects')
  
  // Auth States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Projects States
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', tech_stack: '',
    github_url: '', live_url: '', featured: false,
    status: 'concluido'
  })

  // Settings States
  const [settings, setSettings] = useState({
    availability_text: '',
    availability_text_en: '',
    job_status_text: '',
    job_status_text_en: '',
    resumes_description: '',
    resumes_description_en: '',
    about_me_text: '',
    about_me_text_en: '',
    linkedin_url: '',
    github_url: '',
    whatsapp_url: '',
    contact_email: ''
  })
  const [settingsMessage, setSettingsMessage] = useState('')

  // Resumes States
  const [resumes, setResumes] = useState<Resume[]>([])
  const [resumeName, setResumeName] = useState('')
  const [resumeDescription, setResumeDescription] = useState('')
  const [resumeLanguage, setResumeLanguage] = useState<'pt-BR' | 'en'>('pt-BR')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeMessage, setResumeMessage] = useState('')
  const [editingResumeId, setEditingResumeId] = useState<number | null>(null)

  // Skills States
  const [skills, setSkills] = useState<Skill[]>([])
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [skillForm, setSkillForm] = useState({
    name: '', category: 'frontend', level: 80, color: '#00f0ff'
  })
  const [skillsMessage, setSkillsMessage] = useState('')

  // Experiences States
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null)
  const [experienceForm, setExperienceForm] = useState({
    company: '', role: '', period: '', description: '', techs: '', type: 'work', order_index: 0
  })
  const [expMessage, setExpMessage] = useState('')

  useEffect(() => {
    if (isAuthenticated) loadData()
  }, [isAuthenticated])

  async function loadData() {
    try {
      const [projData, settsData, skillsData, expData] = await Promise.all([
        getProjects(),
        getSettings(),
        getSkills(),
        getExperiences()
      ])
      setProjects(projData || [])
      setSkills(skillsData || [])
      setExperiences(expData || [])
      
      if (settsData) {
        setSettings({
          availability_text: settsData.availability_text || '',
          availability_text_en: settsData.availability_text_en || '',
          job_status_text: settsData.job_status_text || '',
          job_status_text_en: settsData.job_status_text_en || '',
          resumes_description: settsData.resumes_description || '',
          resumes_description_en: settsData.resumes_description_en || '',
          about_me_text: settsData.about_me_text || '',
          about_me_text_en: settsData.about_me_text_en || '',
          linkedin_url: settsData.linkedin_url || '',
          github_url: settsData.github_url || '',
          whatsapp_url: settsData.whatsapp_url || '',
          contact_email: settsData.contact_email || ''
        })
        
        if (settsData.resumes_links) {
          try {
            setResumes(JSON.parse(settsData.resumes_links))
          } catch {
            setResumes([])
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
  }

  // Settings Handlers
  async function handleSaveSettings() {
    setSettingsMessage('Salvando...')
    try {
      await updateSettings(token!, settings)
      setSettingsMessage('Configurações salvas com sucesso!')
      setTimeout(() => setSettingsMessage(''), 3000)
    } catch {
      setSettingsMessage('Erro ao salvar configurações')
    }
  }

  // Resumes Handlers
  async function handleUploadResume(e: React.FormEvent) {
    e.preventDefault()
    if (!resumeName || !resumeFile) return

    setResumeMessage('Enviando para o GitHub (pode demorar)...')
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Data = reader.result as string
      const res = await uploadResume(token!, resumeName, resumeDescription, base64Data, resumeLanguage)
      if (res.error) {
        setResumeMessage(res.error)
      } else {
        setResumeMessage('Currículo enviado com sucesso!')
        setResumeName('')
        setResumeDescription('')
        setResumeLanguage('pt-BR')
        setResumeFile(null)
        loadData()
      }
    }
    reader.readAsDataURL(resumeFile)
  }

  async function handleSaveEditedResume(id: number) {
    if (!resumeName) return
    setResumeMessage('Salvando alterações...')
    const res = await editResume(token!, id, resumeName, resumeDescription, resumeLanguage)
    if (res.error) {
      setResumeMessage(res.error)
    } else {
      setResumeMessage('Currículo atualizado com sucesso!')
      setEditingResumeId(null)
      setResumeName('')
      setResumeDescription('')
      setResumeLanguage('pt-BR')
      loadData()
    }
  }

  function startEditResume(r: Resume) {
    setEditingResumeId(r.id)
    setResumeName(r.name)
    setResumeDescription(r.description || '')
    setResumeLanguage(r.language || 'pt-BR')
  }

  function cancelEditResume() {
    setEditingResumeId(null)
    setResumeName('')
    setResumeDescription('')
    setResumeLanguage('pt-BR')
  }

  async function handleDeleteResume(id: number) {
    if (!confirm('Remover currículo?')) return
    await removeResume(token!, id)
    loadData()
  }

  // Skills Handlers
  async function handleSaveSkill(e: React.FormEvent) {
    e.preventDefault()
    if (!skillForm.name || !skillForm.category) return
    setSkillsMessage('Salvando...')
    try {
      if (editingSkill) {
        await updateSkill(token!, editingSkill.id, skillForm)
        setSkillsMessage('Habilidade atualizada!')
      } else {
        await createSkill(token!, skillForm)
        setSkillsMessage('Habilidade criada!')
      }
      setEditingSkill(null)
      setSkillForm({ name: '', category: 'frontend', level: 80, color: '#00f0ff' })
      loadData()
      setTimeout(() => setSkillsMessage(''), 3000)
    } catch {
      setSkillsMessage('Erro ao salvar habilidade')
    }
  }

  async function handleDeleteSkill(id: number) {
    if (!confirm('Deseja excluir esta habilidade?')) return
    try {
      await removeSkill(token!, id)
      loadData()
    } catch {
      setSkillsMessage('Erro ao excluir habilidade')
    }
  }

  function startEditSkill(s: Skill) {
    setEditingSkill(s)
    setSkillForm({ name: s.name, category: s.category, level: s.level, color: s.color })
  }

  // Experiences Handlers
  async function handleSaveExperience(e: React.FormEvent) {
    e.preventDefault()
    if (!experienceForm.company || !experienceForm.role || !experienceForm.period) return
    setExpMessage('Salvando...')
    try {
      if (editingExperience) {
        await updateExperience(token!, editingExperience.id!, experienceForm)
        setExpMessage('Experiência atualizada!')
      } else {
        await createExperience(token!, experienceForm)
        setExpMessage('Experiência criada!')
      }
      setEditingExperience(null)
      setExperienceForm({ company: '', role: '', period: '', description: '', techs: '', type: 'work', order_index: 0 })
      loadData()
      setTimeout(() => setExpMessage(''), 3000)
    } catch {
      setExpMessage('Erro ao salvar experiência')
    }
  }

  async function handleDeleteExperience(id: number) {
    if (!confirm('Deseja excluir esta experiência?')) return
    try {
      await removeExperience(token!, id)
      loadData()
    } catch {
      setExpMessage('Erro ao excluir experiência')
    }
  }

  function startEditExperience(e: Experience) {
    setEditingExperience(e)
    setExperienceForm({
      company: e.company,
      role: e.role,
      period: e.period,
      description: e.description || '',
      techs: e.techs || '',
      type: e.type,
      order_index: e.order_index ?? 0
    })
  }

  // Login Handlers
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const data = await loginApi(email, password)
    if (data.token) {
      login(data.token)
      setLoginError('')
    } else {
      setLoginError('E-mail ou senha incorretos')
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setLoginError('Preencha o seu e-mail para recuperar a senha')
      return
    }
    setLoginError('')
    setSuccessMessage('Enviando...')
    const data = await forgotPassword(email)
    if (data.error) {
      setSuccessMessage('')
      setLoginError(data.error)
    } else {
      setSuccessMessage(data.message || 'E-mail de recuperação enviado!')
    }
  }

  // Project Handlers
  async function handleSaveProject() {
    const payload = {
      ...form,
      tech_stack: form.tech_stack.split(',').map(t => t.trim()).filter(Boolean)
    }
    const url = editingProject
      ? `${API_URL}/api/projects/${editingProject.id}`
      : `${API_URL}/api/projects`
    const method = editingProject ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    setShowForm(false)
    setEditingProject(null)
    setForm({ title: '', description: '', tech_stack: '', github_url: '', live_url: '', featured: false, status: 'concluido' })
    loadData()
  }

  async function handleDeleteProject(id: number) {
    if (!confirm('Deletar projeto?')) return
    await fetch(`${API_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    loadData()
  }

  function handleEditProject(project: Project) {
    setEditingProject(project)
    setForm({
      title: project.title,
      description: project.description,
      tech_stack: project.tech_stack?.join(', ') || '',
      github_url: project.github_url || '',
      live_url: project.live_url || '',
      featured: project.featured,
      status: project.status || 'concluido'
    })
    setShowForm(true)
  }

  // Tela de login
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6">Admin</h1>
          {loginError && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-4 py-3 mb-4 text-sm">
              {loginError}
            </div>
          )}
          {successMessage && (
            <div className="bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg px-4 py-3 mb-4 text-sm">
              {successMessage}
            </div>
          )}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 py-3 rounded-lg font-medium transition"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Esqueci a senha
            </button>
          </form>
        </div>
      </main>
    )
  }

  // Painel admin
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Painel Admin</h1>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-white transition">
            Sair
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-4 mb-8">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'projects' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-805'}`}
          >
            📁 Projetos
          </button>
          <button
            onClick={() => setActiveTab('resumes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'resumes' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-805'}`}
          >
            📄 Currículos
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'skills' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-805'}`}
          >
            ⚡ Habilidades
          </button>
          <button
            onClick={() => setActiveTab('experiences')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'experiences' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-805'}`}
          >
            ⏳ Experiências
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-805'}`}
          >
            ⚙️ Configurações
          </button>
        </div>

        {/* Tab 1: PROJECTS */}
        {activeTab === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Projetos do Portfólio</h2>
              <button
                onClick={() => { setShowForm(!showForm); setEditingProject(null); setForm({ title: '', description: '', tech_stack: '', github_url: '', live_url: '', featured: false, status: 'concluido' }) }}
                className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-lg text-sm font-medium transition"
              >
                {showForm ? 'Fechar Formulário' : '+ Novo Projeto'}
              </button>
            </div>

            {showForm && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
                <h3 className="text-lg font-semibold mb-4">
                  {editingProject ? 'Editar projeto' : 'Cadastrar novo projeto'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Título" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" />
                  <input placeholder="Tecnologias (ex: React, Node.js, MySQL)" value={form.tech_stack}
                    onChange={e => setForm({ ...form, tech_stack: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" />
                  <input placeholder="URL do GitHub" value={form.github_url}
                    onChange={e => setForm({ ...form, github_url: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" />
                  <input placeholder="URL do projeto (live)" value={form.live_url}
                    onChange={e => setForm({ ...form, live_url: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" />
                  <textarea placeholder="Descrição" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none" />
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={form.featured}
                      onChange={e => setForm({ ...form, featured: e.target.checked })}
                      className="accent-blue-500" />
                    Projeto em destaque
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition"
                  >
                    <option value="concluido">✅ Concluído</option>
                    <option value="em_andamento">🔧 Em andamento</option>
                    <option value="pausado">⏸ Pausado</option>
                  </select>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button onClick={handleSaveProject}
                    className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-lg text-sm font-medium transition">
                    Salvar
                  </button>
                  <button onClick={() => setShowForm(false)}
                    className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {projects.map(project => (
                <div key={project.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{project.title}</h3>
                      {project.featured && (
                        <span className="text-xs bg-blue-500/20 text-teal-400 px-2 py-0.5 rounded-full">Destaque</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{project.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {project.tech_stack?.map(tech => (
                        <span key={tech} className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full">{tech}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button onClick={() => handleEditProject(project)}
                      className="text-sm text-gray-400 hover:text-white transition">
                      Editar
                    </button>
                    <button onClick={() => handleDeleteProject(project.id)}
                      className="text-sm text-red-400 hover:text-red-300 transition">
                      Deletar
                    </button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-gray-500">Nenhum projeto cadastrado.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: RESUMES */}
        {activeTab === 'resumes' && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Gerenciar Currículos</h2>
              {resumeMessage && <span className="text-sm text-teal-400">{resumeMessage}</span>}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-1">Texto explicativo da seção (Aparece na tela "Sobre")</label>
              <textarea 
                value={settings.resumes_description || ''}
                onChange={e => setSettings({ ...settings, resumes_description: e.target.value })}
                placeholder="Ex: Abaixo estão as versões do meu currículo direcionadas para diferentes vagas..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition resize-none h-24"
              />
              <label className="block text-sm text-gray-400 mb-1 mt-4">Texto explicativo da seção em inglês</label>
              <textarea
                value={settings.resumes_description_en || ''}
                onChange={e => setSettings({ ...settings, resumes_description_en: e.target.value })}
                placeholder="Example: Select the résumé that best matches the position..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition resize-none h-24"
              />
              <button 
                onClick={handleSaveSettings}
                className="mt-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Salvar Texto
              </button>
            </div>
            
            {editingResumeId === null && (
              <form onSubmit={handleUploadResume} className="flex flex-col md:flex-row gap-4 mb-6 items-start">
                <div className="flex-1 flex flex-col gap-2 w-full">
                  <input 
                    type="text" 
                    placeholder="Nome (ex: Full Stack)" 
                    value={resumeName}
                    onChange={e => setResumeName(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" 
                    required
                  />
                  <input 
                    type="text" 
                    placeholder="Descrição (ex: Focado em tecnologias backend...)" 
                    value={resumeDescription}
                    onChange={e => setResumeDescription(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" 
                  />
                  <select
                    value={resumeLanguage}
                    onChange={e => setResumeLanguage(e.target.value as 'pt-BR' | 'en')}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                    aria-label="Idioma do currículo"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={e => setResumeFile(e.target.files?.[0] || null)}
                  className="flex-1 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer w-full"
                  required
                />
                <button 
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 px-5 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
                >
                  Fazer Upload
                </button>
              </form>
            )}

            <div className="flex flex-col gap-2">
              {resumes.map(r => (
                <div key={r.id} className="flex flex-col md:flex-row md:items-center justify-between bg-gray-800/50 border border-gray-700/50 p-4 rounded-lg gap-4">
                  {editingResumeId === r.id ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <input 
                        type="text" 
                        placeholder="Nome do currículo" 
                        value={resumeName}
                        onChange={e => setResumeName(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500 transition" 
                      />
                      <select
                        value={resumeLanguage}
                        onChange={e => setResumeLanguage(e.target.value as 'pt-BR' | 'en')}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500 transition"
                        aria-label="Idioma do currículo"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en">English</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Descrição (Opcional)" 
                        value={resumeDescription}
                        onChange={e => setResumeDescription(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500 transition" 
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium mb-1">{r.name}</div>
                      <div className="text-xs text-teal-400 mb-1">{(r.language || 'pt-BR') === 'en' ? 'English' : 'Português (Brasil)'}</div>
                      {r.description && <div className="text-sm text-gray-400 mb-1">{r.description}</div>}
                      <a href={r.url} target="_blank" className="text-xs text-blue-400 hover:underline">{r.url}</a>
                    </div>
                  )}

                  <div className="flex gap-3 shrink-0">
                    {editingResumeId === r.id ? (
                      <>
                        <button 
                          onClick={() => handleSaveEditedResume(r.id)}
                          className="text-sm text-teal-400 hover:text-teal-300"
                        >
                          Salvar
                        </button>
                        <button 
                          onClick={cancelEditResume}
                          className="text-sm text-gray-400 hover:text-gray-300"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEditResume(r)}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteResume(r.id)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Remover
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {resumes.length === 0 && (
                <p className="text-sm text-gray-500">Nenhum currículo cadastrado.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: SKILLS */}
        {activeTab === 'skills' && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4">Gerenciar Habilidades (Skills)</h2>
            {skillsMessage && <div className="bg-blue-500/10 text-teal-400 border border-teal-500/20 px-4 py-2 rounded-lg text-sm mb-4">{skillsMessage}</div>}
            
            <form onSubmit={handleSaveSkill} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-gray-800/30 p-4 rounded-lg border border-gray-800">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome da Tecnologia</label>
                <input 
                  type="text" 
                  placeholder="Ex: React, Node.js"
                  value={skillForm.name}
                  onChange={e => setSkillForm({ ...skillForm, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Categoria</label>
                <select
                  value={skillForm.category}
                  onChange={e => setSkillForm({ ...skillForm, category: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                >
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Banco de dados">Banco de Dados</option>
                  <option value="Ferramentas">Ferramentas</option>
                  <option value="Infraestrutura">Infraestrutura</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nível de Proficiência (SEO/ATS)</label>
                <select
                  value={skillForm.level}
                  onChange={e => setSkillForm({ ...skillForm, level: parseInt(e.target.value) || 90 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition h-10"
                >
                  <option value={90}>Avançado / Especialista</option>
                  <option value={70}>Intermediário</option>
                  <option value={50}>Iniciante / Básico</option>
                </select>
              </div>
              <div className="flex gap-3 items-end md:col-span-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Cor Hex & Preview</label>
                  <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 h-10">
                    <input 
                      type="color" 
                      value={skillForm.color || '#00f0ff'} 
                      onChange={e => setSkillForm({ ...skillForm, color: e.target.value })}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input 
                      type="text" 
                      placeholder="#00f0ff"
                      value={skillForm.color}
                      onChange={e => setSkillForm({ ...skillForm, color: e.target.value })}
                      className="bg-transparent text-white focus:outline-none text-sm w-20"
                    />
                    <div className="flex-1 flex justify-end">
                      <div className="flex items-center gap-1.5 bg-gray-900 px-2.5 py-1 rounded-full border border-gray-800">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: skillForm.color || '#00f0ff' }} />
                        <span className="text-[10px] text-gray-400 font-semibold">{skillForm.name || 'Preview'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 px-5 py-2.5 rounded-lg text-sm font-semibold transition shrink-0 h-10"
                >
                  {editingSkill ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Frontend', 'Backend', 'Banco de dados', 'Ferramentas', 'Infraestrutura'].map(cat => {
                const filtered = skills.filter(s => s.category === cat)
                return (
                  <div key={cat} className="bg-gray-800/40 border border-gray-800 p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-teal-400 mb-3">{cat}</h3>
                    <div className="flex flex-col gap-2">
                      {filtered.map(s => (
                        <div key={s.id} className="flex justify-between items-center bg-gray-800 p-2.5 rounded-lg border border-gray-700/50">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.name} <span className="text-xs text-gray-500">({s.level >= 90 ? 'Avançado' : s.level >= 70 ? 'Intermediário' : 'Iniciante'})</span>
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => startEditSkill(s)} className="text-xs text-blue-400 hover:underline">Editar</button>
                            <button onClick={() => handleDeleteSkill(s.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                          </div>
                        </div>
                      ))}
                      {filtered.length === 0 && (
                        <span className="text-xs text-gray-500 italic">Sem habilidades cadastradas</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab 4: EXPERIENCES */}
        {activeTab === 'experiences' && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4">Gerenciar Experiência & Educação</h2>
            {expMessage && <div className="bg-blue-500/10 text-teal-400 border border-teal-500/20 px-4 py-2 rounded-lg text-sm mb-4">{expMessage}</div>}

            <form onSubmit={handleSaveExperience} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-gray-800/30 p-5 rounded-lg border border-gray-800">
              <h3 className="md:col-span-2 text-sm font-semibold border-b border-gray-700 pb-1 mb-2">
                {editingExperience ? '📝 Editar Item' : '➕ Adicionar Nova Experiência/Estudo'}
              </h3>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Empresa / Instituição</label>
                <input 
                  type="text" 
                  placeholder="Ex: MTEC Energia, Faculdade UDF"
                  value={experienceForm.company}
                  onChange={e => setExperienceForm({ ...experienceForm, company: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cargo / Curso</label>
                <input 
                  type="text" 
                  placeholder="Ex: Estagiário de TI, Bacharelado"
                  value={experienceForm.role}
                  onChange={e => setExperienceForm({ ...experienceForm, role: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Período / Ano</label>
                <input 
                  type="text" 
                  placeholder="Ex: 2025 - Atualmente, Conclusão: 12/2026"
                  value={experienceForm.period}
                  onChange={e => setExperienceForm({ ...experienceForm, period: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo de Registro</label>
                <select
                  value={experienceForm.type}
                  onChange={e => setExperienceForm({ ...experienceForm, type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                >
                  <option value="work">💼 Experiência Profissional</option>
                  <option value="education">🎓 Educação / Acadêmico</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Tecnologias Utilizadas (Separadas por vírgula)</label>
                <input 
                  type="text" 
                  placeholder="Ex: React, Node.js, Cloudflare, Ubuntu Server"
                  value={experienceForm.techs}
                  onChange={e => setExperienceForm({ ...experienceForm, techs: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Descrição / Atividades</label>
                <textarea 
                  placeholder="Descreva suas funções ou detalhes do curso..."
                  value={experienceForm.description}
                  onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Texto de apresentação em inglês</label>
                <textarea
                  value={settings.about_me_text_en || ''}
                  onChange={e => setSettings({ ...settings, about_me_text_en: e.target.value })}
                  placeholder="Write the short professional bio shown on the English home page..."
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Ordem de Exibição (Index)</label>
                <input 
                  type="number" 
                  value={experienceForm.order_index}
                  onChange={e => setExperienceForm({ ...experienceForm, order_index: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Texto de disponibilidade em inglês</label>
                <input
                  type="text"
                  value={settings.availability_text_en || ''}
                  onChange={e => setSettings({ ...settings, availability_text_en: e.target.value })}
                  placeholder="Available for opportunities"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition h-10"
                />
              </div>
              <div className="flex justify-end items-end">
                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 px-6 py-2.5 rounded-lg text-sm font-semibold transition"
                >
                  {editingExperience ? 'Salvar Alterações' : 'Cadastrar Item'}
                </button>
              </div>
            </form>

            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-gray-300 border-b border-gray-800 pb-2 mb-3">💼 Experiência Profissional</h3>
                <div className="flex flex-col gap-3">
                  {experiences.filter(e => e.type === 'work').map(e => (
                    <div key={e.id} className="flex justify-between items-start bg-gray-800/30 border border-gray-800 p-4 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-gray-200">{e.role} em <span className="text-teal-400">{e.company}</span></h4>
                        <p className="text-xs text-gray-500 mb-2">{e.period} (Ordem: {e.order_index})</p>
                        <p className="text-sm text-gray-400 mb-2">{e.description}</p>
                        <span className="text-xs text-gray-500">Techs: {e.techs || 'Nenhuma'}</span>
                      </div>
                      <div className="flex gap-3 shrink-0 ml-4">
                        <button onClick={() => startEditExperience(e)} className="text-sm text-blue-400 hover:underline">Editar</button>
                        <button onClick={() => handleDeleteExperience(e.id!)} className="text-sm text-red-400 hover:underline">Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status profissional em inglês</label>
                <input
                  type="text"
                  value={settings.job_status_text_en || ''}
                  onChange={e => setSettings({ ...settings, job_status_text_en: e.target.value })}
                  placeholder="Internship"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition h-10"
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-300 border-b border-gray-800 pb-2 mb-3">🎓 Histórico Acadêmico</h3>
                <div className="flex flex-col gap-3">
                  {experiences.filter(e => e.type === 'education').map(e => (
                    <div key={e.id} className="flex justify-between items-start bg-gray-800/30 border border-gray-800 p-4 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-gray-200">{e.role}</h4>
                        <p className="text-teal-400 text-sm mb-1">{e.company}</p>
                        <p className="text-xs text-gray-500 mb-2">{e.period} (Ordem: {e.order_index})</p>
                        {e.description && <p className="text-sm text-gray-400">{e.description}</p>}
                      </div>
                      <div className="flex gap-3 shrink-0 ml-4">
                        <button onClick={() => startEditExperience(e)} className="text-sm text-blue-400 hover:underline">Editar</button>
                        <button onClick={() => handleDeleteExperience(e.id!)} className="text-sm text-red-400 hover:underline">Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Configurações Gerais & Redes Sociais</h2>
              {settingsMessage && <span className="text-sm text-teal-400">{settingsMessage}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Profile Text (Bio) */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Texto de Apresentação (Bio da Página Inicial)</label>
                <textarea 
                  value={settings.about_me_text || ''}
                  onChange={e => setSettings({ ...settings, about_me_text: e.target.value })}
                  placeholder="Escreva sua bio profissional curta que aparece no banner principal do site..."
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Texto de Disponibilidade</label>
                <select 
                  value={settings.availability_text || ''}
                  onChange={e => setSettings({ ...settings, availability_text: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition h-10" 
                >
                  <option value="">Selecione uma opção...</option>
                  <option value="Disponível para oportunidades Agora">Disponível para oportunidades Agora</option>
                  <option value="Disponível para propostas mas não buscando ativamente">Disponível para propostas mas não buscando ativamente</option>
                  <option value="Indisponível">Indisponível</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status Profissional Atual</label>
                <select 
                  value={settings.job_status_text || ''}
                  onChange={e => setSettings({ ...settings, job_status_text: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition h-10" 
                >
                  <option value="">Selecione uma opção...</option>
                  <option value="Estagiando">Estagiando</option>
                  <option value="Trabalhando">Trabalhando</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Desempregado">Desempregado</option>
                </select>
              </div>

              {/* Social URLs */}
              <h3 className="md:col-span-2 text-sm font-semibold border-b border-gray-800 pb-1 mt-4 mb-1">🔗 Links Sociais & Contato</h3>

              <div>
                <label className="block text-xs text-gray-400 mb-1">URL do LinkedIn</label>
                <input 
                  type="url" 
                  placeholder="https://linkedin.com/in/usuario"
                  value={settings.linkedin_url || ''}
                  onChange={e => setSettings({ ...settings, linkedin_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">URL do GitHub</label>
                <input 
                  type="url" 
                  placeholder="https://github.com/usuario"
                  value={settings.github_url || ''}
                  onChange={e => setSettings({ ...settings, github_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">WhatsApp Link / Contato Direto</label>
                <input 
                  type="text" 
                  placeholder="https://wa.me/55999999999"
                  value={settings.whatsapp_url || ''}
                  onChange={e => setSettings({ ...settings, whatsapp_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">E-mail Público</label>
                <input 
                  type="email" 
                  placeholder="exemplo@email.com"
                  value={settings.contact_email || ''}
                  onChange={e => setSettings({ ...settings, contact_email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button 
              onClick={handleSaveSettings}
              className="bg-blue-500 hover:bg-blue-600 px-6 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              Salvar Todas as Configurações
            </button>
          </div>
        )}

      </section>
    </main>
  )
}
