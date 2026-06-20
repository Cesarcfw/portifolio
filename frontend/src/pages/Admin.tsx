import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { login as loginApi, getProjects, forgotPassword, getSettings, updateSettings, uploadResume, removeResume } from '../services/api'

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

export default function Admin() {
  const { isAuthenticated, token, login, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', tech_stack: '',
  github_url: '', live_url: '', featured: false,
  status: 'concluido'
  })
  

  const [settings, setSettings] = useState({
    availability_text: '',
    job_status_text: '',
    resumes_description: ''
  })
  const [settingsMessage, setSettingsMessage] = useState('')

  const [resumes, setResumes] = useState<{ id: number, name: string, description?: string, url: string }[]>([])
  const [resumeName, setResumeName] = useState('')
  const [resumeDescription, setResumeDescription] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeMessage, setResumeMessage] = useState('')
  const [editingResumeId, setEditingResumeId] = useState<number | null>(null)

  useEffect(() => {
    if (isAuthenticated) loadData()
  }, [isAuthenticated])

  async function loadData() {
    const [projData, settsData] = await Promise.all([
      getProjects(),
      getSettings()
    ])
    setProjects(projData)
    setSettings(settsData)
    try {
      if (settsData.resumes_links) {
        setResumes(JSON.parse(settsData.resumes_links))
      }
    } catch(e) {}
  }

  async function handleSaveSettings() {
    setSettingsMessage('Salvando...')
    try {
      await updateSettings(token!, settings)
      setSettingsMessage('Configurações salvas!')
      window.location.reload()
    } catch {
      setSettingsMessage('Erro ao salvar')
    }
  }

  async function handleUploadResume(e: React.FormEvent) {
    e.preventDefault()
    if (!resumeName || !resumeFile) return

    setResumeMessage('Enviando para o GitHub (pode demorar)...')
    
    // Ler o arquivo como Base64
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Data = reader.result as string
      const res = await uploadResume(token!, resumeName, resumeDescription, base64Data)
      if (res.error) {
        setResumeMessage(res.error)
      } else {
        setResumeMessage('Currículo enviado com sucesso! Ele aparecerá no site em ~1 minuto.')
        setResumeName('')
        setResumeDescription('')
        setResumeFile(null)
        loadData()
      }
    }
    reader.readAsDataURL(resumeFile)
  }

  async function handleSaveEditedResume(id: number) {
    if (!resumeName) return
    setResumeMessage('Salvando alterações...')
    const res = await editResume(token!, id, resumeName, resumeDescription)
    if (res.error) {
      setResumeMessage(res.error)
    } else {
      setResumeMessage('Currículo atualizado com sucesso!')
      setEditingResumeId(null)
      setResumeName('')
      setResumeDescription('')
      loadData()
    }
  }

  function startEditResume(r: { id: number, name: string, description?: string }) {
    setEditingResumeId(r.id)
    setResumeName(r.name)
    setResumeDescription(r.description || '')
  }

  function cancelEditResume() {
    setEditingResumeId(null)
    setResumeName('')
    setResumeDescription('')
  }

  async function handleDeleteResume(id: number) {
    if (!confirm('Remover currículo? (Isso não apaga o arquivo do GitHub, apenas remove o link do site)')) return
    await removeResume(token!, id)
    loadData()
  }

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

  async function handleSave() {
    const payload = {
      ...form,
      tech_stack: form.tech_stack.split(',').map(t => t.trim())
    }
    const url = editingProject
      ? `http://localhost:3000/api/projects/${editingProject.id}`
      : 'http://localhost:3000/api/projects'
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
    window.location.reload()
  }

  async function handleDelete(id: number) {
    if (!confirm('Deletar projeto?')) return
    await fetch(`http://localhost:3000/api/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    window.location.reload()
  }

  function handleEdit(project: Project) {
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

        {/* Configurações do Perfil */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Configurações do Perfil</h2>
            {settingsMessage && <span className="text-sm text-teal-400">{settingsMessage}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Texto de Disponibilidade</label>
              <select 
                value={settings.availability_text || ''}
                onChange={e => setSettings({ ...settings, availability_text: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition" 
              >
                <option value="">Selecione uma opção...</option>
                <option value="Disponível para oportunidades Agora">Disponível para oportunidades Agora</option>
                <option value="Disponível para propostas mas não buscando ativamente">Disponível para propostas mas não buscando ativamente</option>
                <option value="Indisponível">Indisponível</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status Atual</label>
              <select 
                value={settings.job_status_text || ''}
                onChange={e => setSettings({ ...settings, job_status_text: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition" 
              >
                <option value="">Selecione uma opção...</option>
                <option value="Estagiando">Estagiando</option>
                <option value="Trabalhando">Trabalhando</option>
                <option value="Freelancer">Freelancer</option>
                <option value="Desempregado">Desempregado</option>
              </select>
            </div>
          </div>
          <button 
            onClick={handleSaveSettings}
            className="mt-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition"
          >
            Salvar Configurações
          </button>
        </div>

        {/* Currículos */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
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
            <button 
              onClick={handleSaveSettings}
              className="mt-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Salvar Texto
            </button>
          </div>
          
          {editingResumeId === null && (
            <form onSubmit={handleUploadResume} className="flex flex-col md:flex-row gap-4 mb-6 items-start">
              <div className="flex-1 flex flex-col gap-2">
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
              </div>
              <input 
                type="file" 
                accept=".pdf"
                onChange={e => setResumeFile(e.target.files?.[0] || null)}
                className="flex-1 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer"
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
              <p className="text-sm text-gray-500">Nenhum currículo cadastrado. Faça o upload de um "Currículo Geral" acima para começar.</p>
            )}
          </div>
        </div>

        {/* Botão novo projeto */}
        <button
          onClick={() => { setShowForm(true); setEditingProject(null) }}
          className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-lg text-sm font-medium transition mb-8"
        >
          + Novo projeto
        </button>

        {/* Formulário */}
        {showForm && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
            <h2 className="text-lg font-semibold mb-4">
              {editingProject ? 'Editar projeto' : 'Novo projeto'}
            </h2>
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
              <button onClick={handleSave}
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

        {/* Lista de projetos */}
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
                <button onClick={() => handleEdit(project)}
                  className="text-sm text-gray-400 hover:text-white transition">
                  Editar
                </button>
                <button onClick={() => handleDelete(project.id)}
                  className="text-sm text-red-400 hover:text-red-300 transition">
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>

      </section>
    </main>
  )
}