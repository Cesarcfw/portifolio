import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/auth-context'
import AdminField from '../components/AdminField'
import AdminNotice from '../components/AdminNotice'
import { useUiText } from '../hooks/useUiText'
import { englishContent } from '../utils/contentTranslations'
import { statusEnglish } from '../utils/statusTranslations'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  login as loginApi, 
  getProjects, 
  forgotPassword, 
  getSettings, 
  updateSettings, 
  uploadResumePair,
  uploadResumeCounterpart,
  replaceResumeFile,
  linkResumeCounterparts,
  reorderResumePairs,
  removeResumePair,
  editResume,
  getSkills,
  createSkill,
  updateSkill,
  removeSkill,
  getExperiences,
  createExperience,
  updateExperience,
  removeExperience,
  readResponse, ApiError
} from '../services/api'

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
  name: string
  description?: string
  url: string
  language?: 'pt-BR' | 'en'
  pairId?: number
  order?: number
}

interface ResumePair {
  pairId: number | string
  order: number
  portuguese?: Resume
  english?: Resume
}

function getResumePairs(resumes: Resume[]): ResumePair[] {
  const pairs = new Map<string, ResumePair>()
  resumes.forEach(resume => {
    const pairId = resume.pairId || resume.id
    const key = String(pairId)
    const pair = pairs.get(key) || { pairId, order: Number(resume.order) || 0 }
    if ((resume.language || 'pt-BR') === 'en') pair.english = resume
    else pair.portuguese = resume
    pair.order = Number(resume.order) || pair.order
    pairs.set(key, pair)
  })
  return [...pairs.values()].sort((a, b) => a.order - b.order)
}

function getUnpairedCandidates(resumes: Resume[], language: 'pt-BR' | 'en', excludedPairId: number | string) {
  return getResumePairs(resumes)
    .filter(pair => String(pair.pairId) !== String(excludedPairId) && (!pair.portuguese || !pair.english))
    .map(pair => language === 'en' ? pair.english : pair.portuguese)
    .filter((resume): resume is Resume => Boolean(resume))
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Admin() {
  const { isEnglish } = useLanguage()
  const t = useUiText()
  const { isAuthenticated, token, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'projects' | 'resumes' | 'skills' | 'experiences' | 'settings'>('projects')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  
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
    title: '', title_en: '', description: '', description_en: '', tech_stack: '',
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
  const [resumePtName, setResumePtName] = useState('')
  const [resumePtDescription, setResumePtDescription] = useState('')
  const [resumePtFile, setResumePtFile] = useState<File | null>(null)
  const [resumeEnName, setResumeEnName] = useState('')
  const [resumeEnDescription, setResumeEnDescription] = useState('')
  const [resumeEnFile, setResumeEnFile] = useState<File | null>(null)
  const [resumeMessage, setResumeMessage] = useState('')
  const [editingResumeId, setEditingResumeId] = useState<number | null>(null)
  const [completingResumeId, setCompletingResumeId] = useState<number | null>(null)
  const [replacingResumeId, setReplacingResumeId] = useState<number | null>(null)
  const [replacementFile, setReplacementFile] = useState<File | null>(null)
  const [counterpartName, setCounterpartName] = useState('')
  const [counterpartDescription, setCounterpartDescription] = useState('')
  const [counterpartFile, setCounterpartFile] = useState<File | null>(null)
  const [selectedLegacyCounterparts, setSelectedLegacyCounterparts] = useState<Record<number, string>>({})

  // Skills States
  const [skills, setSkills] = useState<Skill[]>([])
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [skillForm, setSkillForm] = useState({
    name: '', name_en: '', category: 'Frontend', category_en: 'Frontend', level: 80, color: '#00f0ff'
  })
  const [skillsMessage, setSkillsMessage] = useState('')

  // Experiences States
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null)
  const [experienceForm, setExperienceForm] = useState({
    company: '', company_en: '', role: '', role_en: '', period: '', period_en: '', description: '', description_en: '', techs: '', type: 'work', order_index: 0
  })
  const [expMessage, setExpMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)

  function guard<T extends unknown[]>(action: (...args: T) => Promise<void>, feedback: (message: string) => void) {
    return async (...args: T) => {
      const event = args[0] as { preventDefault?: () => void } | undefined
      event?.preventDefault?.()
      if (busyRef.current) return
      busyRef.current = true
      setBusy(true)
      try {
        await action(...args)
      } catch (error) {
        feedback(error instanceof ApiError && /401|TOKEN|UNAUTHORIZED|AUTH_REQUIRED/.test(error.code)
          ? 'Não foi possível autorizar a operação. Seus campos foram preservados; confira sua sessão antes de tentar novamente.'
          : 'Não foi possível concluir a operação. Seu preenchimento foi preservado. Confira a conexão e tente novamente.')
      } finally {
        busyRef.current = false
        setBusy(false)
      }
    }
  }

  const handleSaveSettings = guard(saveSettings, setSettingsMessage)
  const handleUploadResume = guard(uploadResume, setResumeMessage)
  const handleSaveEditedResume = guard(saveEditedResume, setResumeMessage)
  const handleUploadCounterpart = guard(uploadCounterpart, setResumeMessage)
  const handleLinkExistingCounterpart = guard(linkExistingCounterpart, setResumeMessage)
  const handleReplaceResumeFile = guard(replaceFile, setResumeMessage)
  const handleDeleteResumePair = guard(deleteResumePair, setResumeMessage)
  const handleMoveResumePair = guard(moveResumePair, setResumeMessage)
  const handleSaveSkill = guard(saveSkill, setSkillsMessage)
  const handleDeleteSkill = guard(deleteSkill, setSkillsMessage)
  const handleSaveExperience = guard(saveExperience, setExpMessage)
  const handleDeleteExperience = guard(deleteExperience, setExpMessage)
  const handleLogin = guard(signIn, setLoginError)
  const handleForgotPassword = guard(recoverPassword, message => { setSuccessMessage(''); setLoginError(message) })
  const handleSaveProject = guard(saveProject, setSuccessMessage)
  const handleDeleteProject = guard(deleteProject, setSuccessMessage)

  useEffect(() => {
    if (isAuthenticated) loadData(true)
  }, [isAuthenticated])

  async function loadData(includeSettings = false) {
    setLoading(true)
    setLoadError('')
    try {
      const [projData, settsData, skillsData, expData] = await Promise.all([
        getProjects(),
        getSettings(),
        getSkills(),
        getExperiences()
      ])
      setProjects((projData || []).map((p: Project) => ({ ...p,
        title_en: englishContent(p.title, p.title_en) || '',
        description_en: englishContent(p.description, p.description_en) || ''
      })))
      setSkills((skillsData || []).map((s: Skill) => ({ ...s,
        name_en: englishContent(s.name, s.name_en) || '',
        category_en: englishContent(s.category, s.category_en) || ''
      })))
      setExperiences((expData || []).map((e: Experience) => ({ ...e,
        company_en: englishContent(e.company, e.company_en) || '',
        role_en: englishContent(e.role, e.role_en) || '',
        period_en: englishContent(e.period, e.period_en) || '',
        description_en: englishContent(e.description, e.description_en) || ''
      })))
      
      if (settsData) {
        if (includeSettings) setSettings({
          availability_text: settsData.availability_text || '',
          availability_text_en: settsData.availability_text_en || statusEnglish(settsData.availability_text) || '',
          job_status_text: settsData.job_status_text || '',
          job_status_text_en: settsData.job_status_text_en || statusEnglish(settsData.job_status_text) || '',
          resumes_description: settsData.resumes_description || '',
          resumes_description_en: englishContent(settsData.resumes_description, settsData.resumes_description_en) || '',
          about_me_text: settsData.about_me_text || '',
          about_me_text_en: englishContent(settsData.about_me_text, settsData.about_me_text_en) || '',
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
      setLoadError('Não foi possível carregar o conteúdo do painel. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Settings Handlers
  async function saveSettings() {
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
  async function uploadResume(e: React.FormEvent) {
    e.preventDefault()
    if (!resumePtName || !resumePtFile || !resumeEnName || !resumeEnFile) {
      setResumeMessage('Preencha e selecione os currículos nos dois idiomas.')
      return
    }

    const readFile = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })

    setResumeMessage('Enviando os dois arquivos para o GitHub...')
    try {
      const [ptBase64, enBase64] = await Promise.all([readFile(resumePtFile), readFile(resumeEnFile)])
      const result = await uploadResumePair(
        token!,
        { name: resumePtName, description: resumePtDescription, base64Data: ptBase64 },
        { name: resumeEnName, description: resumeEnDescription, base64Data: enBase64 }
      )
      if (result.error) {
        setResumeMessage(result.error)
        return
      }

      setResumeMessage('Par de currículos enviado com sucesso!')
      setResumePtName('')
      setResumePtDescription('')
      setResumePtFile(null)
      setResumeEnName('')
      setResumeEnDescription('')
      setResumeEnFile(null)
      loadData()
    } catch {
      setResumeMessage('Erro ao ler ou enviar os arquivos.')
    }
  }

  async function saveEditedResume(id: number) {
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

  async function uploadCounterpart(e: React.FormEvent, originalResume: Resume) {
    e.preventDefault()
    if (!counterpartName || !counterpartFile) {
      setResumeMessage('Informe o nome e selecione o PDF da versão ausente.')
      return
    }

    setResumeMessage('Enviando a versão ausente para o GitHub...')
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(counterpartFile)
      })
      const result = await uploadResumeCounterpart(token!, originalResume.id, {
        name: counterpartName,
        description: counterpartDescription,
        base64Data
      })

      if (result.error) {
        setResumeMessage(result.error)
        return
      }

      setResumeMessage('Versão ausente adicionada com sucesso!')
      cancelCompleteResume()
      loadData()
    } catch {
      setResumeMessage('Erro ao ler ou enviar o arquivo.')
    }
  }

  function startCompleteResume(originalResume: Resume) {
    setCompletingResumeId(originalResume.id)
    setCounterpartName('')
    setCounterpartDescription('')
    setCounterpartFile(null)
  }

  function cancelCompleteResume() {
    setCompletingResumeId(null)
    setCounterpartName('')
    setCounterpartDescription('')
    setCounterpartFile(null)
  }

  async function linkExistingCounterpart(originalResume: Resume, missingLanguage: 'pt-BR' | 'en') {
    const selectedId = Number(selectedLegacyCounterparts[originalResume.id])
    if (!Number.isInteger(selectedId)) {
      setResumeMessage('Selecione um currículo existente para vincular.')
      return
    }

    setResumeMessage('Vinculando os currículos existentes...')
    const result = await linkResumeCounterparts(
      token!,
      missingLanguage === 'pt-BR' ? selectedId : originalResume.id,
      missingLanguage === 'en' ? selectedId : originalResume.id
    )
    if (result.error) {
      setResumeMessage(result.error)
      return
    }

    setSelectedLegacyCounterparts(current => {
      const next = { ...current }
      delete next[originalResume.id]
      return next
    })
    setResumeMessage('Currículos existentes vinculados com sucesso!')
    loadData()
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

  function startReplaceResume(resumeId: number) {
    setReplacingResumeId(resumeId)
    setReplacementFile(null)
  }

  function cancelReplaceResume() {
    setReplacingResumeId(null)
    setReplacementFile(null)
  }

  async function replaceFile(e: React.FormEvent, resume: Resume) {
    e.preventDefault()
    if (!replacementFile) {
      setResumeMessage('Selecione o novo arquivo PDF.')
      return
    }

    setResumeMessage(`Substituindo o PDF de ${isEnglish ? englishContent(resume.name) || resume.name : resume.name}...`)
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(replacementFile)
      })
      const result = await replaceResumeFile(token!, resume.id, base64Data)
      if (result.error) {
        setResumeMessage(result.error)
        return
      }

      setResumeMessage('PDF substituído com sucesso! Aguarde a atualização do deploy.')
      cancelReplaceResume()
      loadData()
    } catch {
      setResumeMessage('Erro ao ler ou substituir o arquivo.')
    }
  }

  async function deleteResumePair(pairId: number | string) {
    if (!confirm(t("Remover as duas versões deste currículo?"))) return
    await removeResumePair(token!, pairId)
    loadData()
  }

  async function moveResumePair(pairId: number | string, direction: -1 | 1) {
    const currentPairs = getResumePairs(resumes)
    const index = currentPairs.findIndex(pair => String(pair.pairId) === String(pairId))
    const target = index + direction
    if (index < 0 || target < 0 || target >= currentPairs.length) return

    const reordered = [...currentPairs]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    await reorderResumePairs(token!, reordered.map(pair => pair.pairId))
    loadData()
  }

  // Skills Handlers
  async function saveSkill(e: React.FormEvent) {
    e.preventDefault()
    if (!skillForm.name || !skillForm.name_en || !skillForm.category || !skillForm.category_en) {
      setSkillsMessage('Preencha nome e categoria nos dois idiomas.')
      return
    }
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
      setSkillForm({ name: '', name_en: '', category: 'Frontend', category_en: 'Frontend', level: 80, color: '#00f0ff' })
      loadData()
      setTimeout(() => setSkillsMessage(''), 3000)
    } catch {
      setSkillsMessage('Erro ao salvar habilidade')
    }
  }

  async function deleteSkill(id: number) {
    if (!confirm(t("Deseja excluir esta habilidade?"))) return
    try {
      await removeSkill(token!, id)
      loadData()
    } catch {
      setSkillsMessage('Erro ao excluir habilidade')
    }
  }

  function startEditSkill(s: Skill) {
    setEditingSkill(s)
    setSkillForm({ name: s.name, name_en: s.name_en || '', category: s.category, category_en: s.category_en || '', level: s.level, color: s.color })
  }

  // Experiences Handlers
  async function saveExperience(e: React.FormEvent) {
    e.preventDefault()
    if (!experienceForm.company || !experienceForm.company_en || !experienceForm.role || !experienceForm.role_en || !experienceForm.period || !experienceForm.period_en) {
      setExpMessage('Preencha empresa, cargo e período nos dois idiomas.')
      return
    }
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
      setExperienceForm({ company: '', company_en: '', role: '', role_en: '', period: '', period_en: '', description: '', description_en: '', techs: '', type: 'work', order_index: 0 })
      loadData()
      setTimeout(() => setExpMessage(''), 3000)
    } catch {
      setExpMessage('Erro ao salvar experiência')
    }
  }

  async function deleteExperience(id: number) {
    if (!confirm(t("Deseja excluir esta experiência?"))) return
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
      company_en: e.company_en || '',
      role: e.role,
      role_en: e.role_en || '',
      period: e.period,
      period_en: e.period_en || '',
      description: e.description || '',
      description_en: e.description_en || '',
      techs: e.techs || '',
      type: e.type,
      order_index: e.order_index ?? 0
    })
  }

  // Login Handlers
  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setSuccessMessage('')
    try {
      const data = await loginApi(email, password)
      if (data.token) {
        login(data.token)
        setLoginError('')
      } else {
        setLoginError('E-mail ou senha incorretos')
      }
    } catch (error) {
      if (error instanceof ApiError && ['HTTP_401', 'AUTH_INVALID_CREDENTIALS'].includes(error.code)) setLoginError('E-mail ou senha incorretos')
      else throw error
    }
  }

  async function recoverPassword() {
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
  async function saveProject() {
    if (!form.title || !form.title_en) {
      setSuccessMessage('Preencha o título do projeto nos dois idiomas.')
      return
    }
    const payload = {
      ...form,
      tech_stack: form.tech_stack.split(',').map(t => t.trim()).filter(Boolean)
    }
    const url = editingProject
      ? `${API_URL}/api/projects/${editingProject.id}`
      : `${API_URL}/api/projects`
    const method = editingProject ? 'PUT' : 'POST'

    await readResponse(await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }))
    setShowForm(false)
    setEditingProject(null)
    setForm({ title: '', title_en: '', description: '', description_en: '', tech_stack: '', github_url: '', live_url: '', featured: false, status: 'concluido' })
    loadData()
  }

  async function deleteProject(id: number) {
    if (!confirm(t("Deletar projeto?"))) return
    await readResponse(await fetch(`${API_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }))
    loadData()
  }

  function handleEditProject(project: Project) {
    setEditingProject(project)
    setForm({
      title: project.title,
      title_en: project.title_en || '',
      description: project.description,
      description_en: project.description_en || '',
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
      <main id="main-content" lang={isEnglish ? 'en' : 'pt-BR'} className="admin-page auth-page">
        <div className="auth-card">
          <h1>{t("Acesso administrativo")}</h1>

          <p className="auth-description">{t("Entre para gerenciar o conteúdo do seu portfólio.")}</p>
          {loginError && (
            <div role="alert" className="admin-notice bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-4 py-3 mb-4 text-sm">
              {t(loginError)}
            </div>
          )}
          {successMessage && (
            <div role="status" className="admin-notice bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg px-4 py-3 mb-4 text-sm">
              {t(successMessage)}
            </div>
          )}
          <form onSubmit={handleLogin} className="flex flex-col gap-4" aria-busy={busy}>
            <label htmlFor="admin-email">{t("E-mail")}</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              maxLength={254}
              required
              placeholder={t("E-mail")}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
            <label htmlFor="admin-password">{t("Senha")}</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              maxLength={128}
              required
              placeholder={t("Senha")}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
            <button
              type="submit"
              disabled={busy}
              className="bg-blue-500 hover:bg-blue-600 py-3 rounded-lg font-medium transition"
            >
              {busy ? t("Aguarde…") : t("Entrar")}
            </button>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={busy}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              {t("Esqueci a senha")}
            </button>
          </form>
          <a className="auth-back" href="/">{t("Voltar ao portfólio")}</a>
        </div>
      </main>
    )
  }

  // Painel admin
  return (
    <main id="main-content" lang={isEnglish ? 'en' : 'pt-BR'} className="admin-page">
      <section className="admin-shell">


        {/* Header */}
        <div className="admin-header">
          <div><h1>{t("Painel administrativo")}</h1>
            <p>{t("Projetos, currículos e conteúdo do portfólio.")}</p></div>
          <button onClick={logout} className="admin-secondary">
            {t("Sair da conta")}
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="admin-tabs" aria-label={t("Seções do painel")}>
          <button
            onClick={() => setActiveTab('projects')}
            aria-pressed={activeTab === 'projects'}
            aria-controls="admin-content"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'projects' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-805'}`}
          >
            {t("Projetos")}
          </button>
          <button
            onClick={() => setActiveTab('resumes')}
            aria-pressed={activeTab === 'resumes'}
            aria-controls="admin-content"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'resumes' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-805'}`}
          >
            {t("Currículos")}
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            aria-pressed={activeTab === 'skills'}
            aria-controls="admin-content"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'skills' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-805'}`}
          >
            {t("Habilidades")}
          </button>
          <button
            onClick={() => setActiveTab('experiences')}
            aria-pressed={activeTab === 'experiences'}
            aria-controls="admin-content"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'experiences' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-805'}`}
          >
            {t("Experiências")}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            aria-pressed={activeTab === 'settings'}
            aria-controls="admin-content"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-805'}`}
          >
            {t("Configurações")}
          </button>
        </nav>

        {loading && <p role="status" className="admin-loading">{t("Carregando conteúdo do painel...")}</p>}
        {loadError && <div role="alert" className="admin-load-error"><p>{t(loadError)}</p><button onClick={() => loadData(true)}>{t("Tentar novamente")}</button></div>}
        {busy && <p role="status">{t("Processando operação. Aguarde…")}</p>}
        <fieldset disabled={busy} id="admin-content" className="admin-content" aria-busy={loading || busy}>
        <legend className="sr-only">{t("Edição de conteúdo")}</legend>
        {(projects.some(p => !p.title_en || (p.description && !p.description_en)) ||
          experiences.some(e => !e.role_en || !e.period_en || (e.description && !e.description_en)) ||
          skills.some(s => !s.name_en || !s.category_en) ||
          ['availability_text', 'job_status_text', 'about_me_text', 'resumes_description'].some(key => settings[key as keyof typeof settings] && !settings[`${key}_en` as keyof typeof settings])) &&
          <p role="status" className="admin-notice">{t("Há conteúdo sem versão em inglês. Confira os campos em inglês de Projetos, Experiências, Habilidades e Configurações. A versão pública sinaliza traduções pendentes, sem tradução automática.")}</p>}

        {/* Tab 1: PROJECTS */}
        {activeTab === 'projects' && (
          <div>
            <div className="admin-section-header">
              <div><h2>{t("Projetos do portfólio")}</h2><p>{t("Gerencie os projetos publicados e seus destaques.")}</p></div>
              <button
                onClick={() => { setSuccessMessage(''); setShowForm(!showForm); setEditingProject(null); setForm({ title: '', title_en: '', description: '', description_en: '', tech_stack: '', github_url: '', live_url: '', featured: false, status: 'concluido' }) }}
                className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-lg text-sm font-medium transition"
              >
                {showForm ? t("Fechar formulário") : t("Novo projeto")}
              </button>
            </div>

            {showForm && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
                <h3 className="text-lg font-semibold mb-4">
                  {editingProject ? t("Editar projeto") : t("Cadastrar novo projeto")}
                </h3>
                <AdminNotice message={t(successMessage)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AdminField label={t("Título em português")}><input placeholder={t("Título")} value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" /></AdminField>
                  <AdminField label={t("Título em inglês")}><input placeholder={t("Title (English)")} value={form.title_en}
                    onChange={e => setForm({ ...form, title_en: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" required /></AdminField>
                  <AdminField label={t("Tecnologias (separadas por vírgula)")}><input placeholder={t("Tecnologias (ex: React, Node.js, MySQL)")} value={form.tech_stack}
                    onChange={e => setForm({ ...form, tech_stack: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" /></AdminField>
                  <AdminField label={t("URL do GitHub")}><input placeholder={t("URL do GitHub")} value={form.github_url}
                    onChange={e => setForm({ ...form, github_url: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" /></AdminField>
                  <AdminField label={t("URL do projeto publicado")}><input placeholder={t("URL do projeto (live)")} value={form.live_url}
                    onChange={e => setForm({ ...form, live_url: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" /></AdminField>
                  <AdminField label={t("Descrição em português")} className="md:col-span-2"><textarea placeholder={t("Descrição")} value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none" /></AdminField>
                  <AdminField label={t("Descrição em inglês")} className="md:col-span-2"><textarea placeholder={t("Description (English)")} value={form.description_en}
                    onChange={e => setForm({ ...form, description_en: e.target.value })}
                    rows={3}
                    className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none" /></AdminField>
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={form.featured}
                      onChange={e => setForm({ ...form, featured: e.target.checked })}
                      className="accent-blue-500" />
                    {t("Projeto em destaque")}
                  </label>
                  <AdminField label={t("Status do projeto")}><select id="admin-control-1"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition"
                  >
                    <option value="concluido">{t("Concluído")}</option>
                    <option value="em_andamento">{t("Em andamento")}</option>
                    <option value="pausado">{t("Pausado")}</option>
                  </select></AdminField>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button onClick={handleSaveProject}
                    className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-lg text-sm font-medium transition">
                    {t("Salvar")}
                  </button>
                  <button onClick={() => setShowForm(false)}
                    className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition">
                    {t("Cancelar")}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {projects.map(project => (
                <div key={project.id} className="admin-record bg-gray-900 rounded-xl p-5 border border-gray-800 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{isEnglish ? project.title_en || project.title : project.title}</h3>
                      {project.featured && (
                        <span className="text-xs bg-blue-500/20 text-teal-400 px-2 py-0.5 rounded-full">{t("Destaque")}</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{isEnglish ? project.description_en || project.description : project.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {project.tech_stack?.map(tech => (
                        <span key={tech} className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full">{tech}</span>
                      ))}
                    </div>
                  </div>
                  <div className="admin-record-actions flex gap-2 ml-4 shrink-0">
                    <button aria-label={`${isEnglish ? 'Edit project' : 'Editar projeto'} ${isEnglish ? project.title_en : project.title}`} onClick={() => { setSuccessMessage(''); handleEditProject(project) }}
                      className="text-sm text-gray-400 hover:text-white transition">
                      {t("Editar")}
                    </button>
                    <button aria-label={`${isEnglish ? 'Delete project' : 'Excluir projeto'} ${isEnglish ? project.title_en : project.title}`} onClick={() => handleDeleteProject(project.id)}
                      className="text-sm text-red-400 hover:text-red-300 transition">
                      {t("Excluir")}
                    </button>
                  </div>
                </div>
              ))}
              {!loading && !loadError && projects.length === 0 && (
                <p className="text-gray-500">{t("Nenhum projeto cadastrado.")}</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: RESUMES */}
        {activeTab === 'resumes' && (
          <div className="admin-panel bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t("Currículos")}</h2>
              <AdminNotice message={resumeMessage} />
            </div>

            <div className="mb-6">
              <label htmlFor="admin-control-2" className="block text-sm text-gray-400 mb-1">{t("Texto explicativo da seção (Aparece na tela \"Sobre\")")}</label>
              <textarea id="admin-control-2"
                value={settings.resumes_description || ''}
                onChange={e => setSettings({ ...settings, resumes_description: e.target.value })}
                placeholder={t("Ex: Abaixo estão as versões do meu currículo direcionadas para diferentes vagas...")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition resize-none h-24"
              />
              <label htmlFor="admin-control-3" className="block text-sm text-gray-400 mb-1 mt-4">{t("Texto explicativo da seção em inglês")}</label>
              <textarea id="admin-control-3"
                value={settings.resumes_description_en || ''}
                onChange={e => setSettings({ ...settings, resumes_description_en: e.target.value })}
                placeholder={t("Example: Select the résumé that best matches the position...")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition resize-none h-24"
              />
              <button 
                onClick={handleSaveSettings}
                className="mt-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                {t("Salvar Texto")}
              </button>
            </div>
            
            {editingResumeId === null && (
              <form onSubmit={handleUploadResume} className="mb-8">
                <h3 className="admin-subheading">{t("Cadastrar um par de currículos")}</h3>
                <p className="admin-help">{t("Envie as versões em português e inglês juntas. Cada arquivo deve ser PDF e ter até 5 MB.")}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex flex-col gap-3">
                    <h3 className="font-semibold text-teal-400">{t("Português (Brasil)")}</h3>
                    <AdminField label={t("Nome do currículo em português")}><input type="text" placeholder={t("Nome do currículo")} value={resumePtName}
                      onChange={e => setResumePtName(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" required /></AdminField>
                    <AdminField label={t("Descrição em português")}><input type="text" placeholder={t("Descrição")} value={resumePtDescription}
                      onChange={e => setResumePtDescription(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" /></AdminField>
                    <AdminField label={t("PDF em português (até 5 MB)")}><input type="file" accept=".pdf" onChange={e => setResumePtFile(e.target.files?.[0] || null)}
                      className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-700 file:text-white" required /></AdminField>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex flex-col gap-3">
                    <h3 className="font-semibold text-blue-400">{t("English")}</h3>
                    <AdminField label={t("Nome do currículo em inglês")}><input type="text" placeholder={t("Résumé name")} value={resumeEnName}
                      onChange={e => setResumeEnName(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" required /></AdminField>
                    <AdminField label={t("Descrição em inglês")}><input type="text" placeholder={t("Description")} value={resumeEnDescription}
                      onChange={e => setResumeEnDescription(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" /></AdminField>
                    <AdminField label={t("PDF em inglês (até 5 MB)")}><input type="file" accept=".pdf" onChange={e => setResumeEnFile(e.target.files?.[0] || null)}
                      className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-700 file:text-white" required /></AdminField>
                  </div>
                </div>
                <button type="submit" className="mt-4 bg-teal-500 hover:bg-teal-600 px-5 py-2 rounded-lg text-sm font-medium transition">
                  {t("Enviar par de currículos")}
                </button>
              </form>
            )}

            <div className="flex flex-col gap-4">
              {getResumePairs(resumes).map((pair, index, pairs) => (
                <div key={pair.pairId} className="admin-resume-pair bg-gray-800/40 border border-gray-700/50 p-4 rounded-xl">
                  <div className="admin-pair-header flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-300">{t("Posição")} {index + 1}</span>
                    <div className="flex gap-3 text-sm">
                      <button onClick={() => handleMoveResumePair(pair.pairId, -1)} disabled={index === 0}
                        className="text-gray-300 disabled:opacity-30">{t("↑ Subir")}</button>
                      <button onClick={() => handleMoveResumePair(pair.pairId, 1)} disabled={index === pairs.length - 1}
                        className="text-gray-300 disabled:opacity-30">{t("↓ Descer")}</button>
                      <button onClick={() => handleDeleteResumePair(pair.pairId)} className="text-red-400">{t("Remover par")}</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[pair.portuguese, pair.english].map((resume, resumeIndex) => resume ? (
                      <div key={resume.id} className="admin-resume-card bg-gray-800 p-4 rounded-lg border border-gray-700">
                        {editingResumeId === resume.id ? (
                          <div className="flex flex-col gap-2">
                            <AdminField label={t("Nome do currículo")}><input value={resumeName} onChange={e => setResumeName(e.target.value)}
                              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2" /></AdminField>
                            <AdminField label={t("Descrição do currículo")}><input value={resumeDescription} onChange={e => setResumeDescription(e.target.value)}
                              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2" /></AdminField>
                            <div className="flex gap-3 text-sm">
                              <button onClick={() => handleSaveEditedResume(resume.id)} className="text-teal-400">{t("Salvar")}</button>
                              <button onClick={cancelEditResume} className="text-gray-400">{t("Cancelar")}</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-xs text-teal-400 mb-1">{resumeIndex === 0 ? t("Português (Brasil)") : t("English")}</div>
                            <div className="font-medium">{isEnglish ? englishContent(resume.name) || resume.name : resume.name}</div>
                            {resume.description && <div className="text-sm text-gray-400 mt-1">{isEnglish ? englishContent(resume.description) || resume.description : resume.description}</div>}
                            <div className="flex items-center justify-between mt-3 gap-3">
                              <a href={resume.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">{t("Abrir PDF")}</a>
                              <div className="flex items-center gap-3">
                                <button onClick={() => startReplaceResume(resume.id)} className="text-sm text-teal-400">{t("Substituir PDF")}</button>
                                <button onClick={() => startEditResume(resume)} className="text-sm text-blue-400">{t("Editar")}</button>
                              </div>
                            </div>
                            {replacingResumeId === resume.id && (
                              <form onSubmit={e => handleReplaceResumeFile(e, resume)} className="mt-3 border-t border-gray-700 pt-3 flex flex-col gap-2">
                                <label htmlFor={`replacement-${resume.id}`} className="text-xs text-gray-400">{t("Novo arquivo PDF")}</label>
                                <input
                                  id={`replacement-${resume.id}`}
                                  type="file"
                                  accept="application/pdf,.pdf"
                                  onChange={e => setReplacementFile(e.target.files?.[0] || null)}
                                  className="text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-700 file:text-white"
                                  required
                                />
                                <div className="flex gap-3 text-sm">
                                  <button type="submit" className="text-teal-400">{t("Confirmar substituição")}</button>
                                  <button type="button" onClick={cancelReplaceResume} className="text-gray-400">{t("Cancelar")}</button>
                                </div>
                              </form>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div key={resumeIndex} className="border border-dashed border-yellow-600/50 rounded-lg p-4 text-sm">
                        <div className="text-yellow-400/80 mb-3">
                          {t("Versão")} {resumeIndex === 0 ? t("em português") : t("em inglês")} {t("ausente — registro legado.")}
                        </div>
                        {(() => {
                          const originalResume = (pair.portuguese || pair.english)!
                          const missingLanguage = resumeIndex === 0 ? 'pt-BR' : 'en'
                          const existingCandidates = getUnpairedCandidates(resumes, missingLanguage, pair.pairId)
                          return existingCandidates.length > 0 ? (
                            <div className="mb-4 flex flex-col gap-2">
                              <label htmlFor={`counterpart-link-${originalResume.id}`} className="text-xs text-gray-400">{t("Vincular um PDF já cadastrado")}</label>
                              <select
                                id={`counterpart-link-${originalResume.id}`}
                                value={selectedLegacyCounterparts[originalResume.id] || ''}
                                onChange={e => setSelectedLegacyCounterparts(current => ({ ...current, [originalResume.id]: e.target.value }))}
                                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                              >
                                <option value="">{t("Selecione...")}</option>
                                {existingCandidates.map(candidate => (
                                  <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleLinkExistingCounterpart(originalResume, missingLanguage)}
                                className="self-start text-blue-400 hover:text-blue-300"
                              >
                                {t("Vincular currículo existente")}
                              </button>
                            </div>
                          ) : null
                        })()}
                        {completingResumeId === (pair.portuguese || pair.english)?.id ? (
                          <form onSubmit={e => handleUploadCounterpart(e, (pair.portuguese || pair.english)!)} className="flex flex-col gap-2">
                            <AdminField label={t("Nome da versão ausente")}><input
                              value={counterpartName}
                              onChange={e => setCounterpartName(e.target.value)}
                              placeholder={t(resumeIndex === 0 ? 'Nome do currículo' : 'Résumé name')}
                              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                              required
                            /></AdminField>
                            <AdminField label={t("Descrição da versão ausente")}><input
                              value={counterpartDescription}
                              onChange={e => setCounterpartDescription(e.target.value)}
                              placeholder={t(resumeIndex === 0 ? 'Descrição' : 'Description')}
                              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                            /></AdminField>
                            <AdminField label={t("PDF da versão ausente (até 5 MB)")}><input
                              type="file"
                              accept=".pdf"
                              onChange={e => setCounterpartFile(e.target.files?.[0] || null)}
                              className="text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-700 file:text-white"
                              required
                            /></AdminField>
                            <div className="flex gap-3 mt-1">
                              <button type="submit" className="text-teal-400">{t("Adicionar versão")}</button>
                              <button type="button" onClick={cancelCompleteResume} className="text-gray-400">{t("Cancelar")}</button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => startCompleteResume((pair.portuguese || pair.english)!)}
                            className="text-teal-400 hover:text-teal-300"
                          >
                            {t("Adicionar versão")} {resumeIndex === 0 ? t("em português") : t("em inglês")}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {resumes.length === 0 && <p className="text-sm text-gray-500">{t("Nenhum currículo cadastrado.")}</p>}
            </div>
          </div>
        )}

        {/* Tab 3: SKILLS */}
        {activeTab === 'skills' && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4">{t("Habilidades")}</h2>
            <AdminNotice message={skillsMessage} />
            
            <form onSubmit={handleSaveSkill} className="admin-skill-form grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-gray-800/30 p-4 rounded-lg border border-gray-800">
              <div>
                <label htmlFor="admin-control-4" className="block text-xs text-gray-400 mb-1">{t("Nome da Tecnologia")}</label>
                <input id="admin-control-4"
                  type="text" 
                  placeholder={t("Ex: React, Node.js")}
                  value={skillForm.name}
                  onChange={e => setSkillForm({ ...skillForm, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-control-5" className="block text-xs text-gray-400 mb-1">{t("Nome em inglês")}</label>
                <input id="admin-control-5"
                  type="text"
                  placeholder={t("Example: Databases")}
                  value={skillForm.name_en}
                  onChange={e => setSkillForm({ ...skillForm, name_en: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-control-6" className="block text-xs text-gray-400 mb-1">{t("Categoria")}</label>
                <select id="admin-control-6"
                  value={skillForm.category}
                  onChange={e => {
                    const translations: Record<string, string> = { Frontend: 'Frontend', Backend: 'Backend', 'Banco de dados': 'Databases', Ferramentas: 'Tools', Infraestrutura: 'Infrastructure' }
                    setSkillForm({ ...skillForm, category: e.target.value, category_en: translations[e.target.value] || '' })
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                >
                  <option value="Frontend">{t("Frontend")}</option>
                  <option value="Backend">{t("Backend")}</option>
                  <option value="Banco de dados">{t("Banco de Dados")}</option>
                  <option value="Ferramentas">{t("Ferramentas")}</option>
                  <option value="Infraestrutura">{t("Infraestrutura")}</option>
                </select>
              </div>
              <div>
                <label htmlFor="admin-control-7" className="block text-xs text-gray-400 mb-1">{t("Categoria em inglês")}</label>
                <input id="admin-control-7"
                  type="text"
                  value={skillForm.category_en}
                  onChange={e => setSkillForm({ ...skillForm, category_en: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-control-8" className="block text-xs text-gray-400 mb-1">{t("Nível de proficiência")}</label>
                <select id="admin-control-8"
                  value={skillForm.level}
                  onChange={e => setSkillForm({ ...skillForm, level: parseInt(e.target.value) || 90 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition h-10"
                >
                  <option value={90}>{t("Avançado / Especialista")}</option>
                  <option value={70}>{t("Intermediário")}</option>
                  <option value={50}>{t("Iniciante / Básico")}</option>
                </select>
              </div>
              <div className="flex gap-3 items-end md:col-span-2">
                <div className="flex-1">
                  <label htmlFor="skill-color" className="block text-xs text-gray-400 mb-1">{t("Cor da habilidade")}</label>
                  <div className="admin-color-control flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 h-10">
                    <input 
                      id="skill-color"
                      type="color" 
                      value={skillForm.color || '#00f0ff'} 
                      onChange={e => setSkillForm({ ...skillForm, color: e.target.value })}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input 
                      aria-label={t("Código hexadecimal da cor")}
                      type="text" 
                      placeholder={t("#00f0ff")}
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
                  {editingSkill ? t("Salvar") : t("Adicionar")}
                </button>
              </div>
            </form>

            <div className="admin-skill-groups grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Frontend', 'Backend', 'Banco de dados', 'Ferramentas', 'Infraestrutura'].map(cat => {
                const filtered = skills.filter(s => s.category === cat)
                return (
                  <div key={cat} className="admin-skill-group bg-gray-800/40 border border-gray-800 p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-teal-400 mb-3">{t(cat)}</h3>
                    <div className="flex flex-col gap-2">
                      {filtered.map(s => (
                        <div key={s.id} className="admin-skill-row flex justify-between items-center bg-gray-800 p-2.5 rounded-lg border border-gray-700/50">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                            {isEnglish ? s.name_en || s.name : s.name} <span className="text-xs text-gray-500">{t("(")}{s.level >= 90 ? t("Avançado") : s.level >= 70 ? t("Intermediário") : t("Iniciante")}{t(")")}</span>
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => startEditSkill(s)} className="text-xs text-blue-400 hover:underline">{t("Editar")}</button>
                            <button onClick={() => handleDeleteSkill(s.id)} className="text-xs text-red-400 hover:underline">{t("Excluir")}</button>
                          </div>
                        </div>
                      ))}
                      {filtered.length === 0 && (
                        <span className="text-xs text-gray-500 italic">{t("Sem habilidades cadastradas")}</span>
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
            <h2 className="text-xl font-bold mb-4">{t("Experiência e formação")}</h2>
            <AdminNotice message={expMessage} />

            <form onSubmit={handleSaveExperience} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-gray-800/30 p-5 rounded-lg border border-gray-800">
                <h3 className="md:col-span-2 text-sm font-semibold border-b border-gray-700 pb-1 mb-2">
                {editingExperience ? t("Editar experiência ou formação") : t("Adicionar experiência ou formação")}
              </h3>
              <div>
                <label htmlFor="admin-control-9" className="block text-xs text-gray-400 mb-1">{t("Empresa / Instituição")}</label>
                <input id="admin-control-9"
                  type="text" 
                  placeholder={t("Ex: MTEC Energia, Faculdade UDF")}
                  value={experienceForm.company}
                  onChange={e => setExperienceForm({ ...experienceForm, company: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-control-10" className="block text-xs text-gray-400 mb-1">{t("Company / Institution (English)")}</label>
                <input id="admin-control-10"
                  type="text"
                  value={experienceForm.company_en}
                  onChange={e => setExperienceForm({ ...experienceForm, company_en: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-control-11" className="block text-xs text-gray-400 mb-1">{t("Cargo / Curso")}</label>
                <input id="admin-control-11"
                  type="text" 
                  placeholder={t("Ex: Estagiário de TI, Bacharelado")}
                  value={experienceForm.role}
                  onChange={e => setExperienceForm({ ...experienceForm, role: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-control-12" className="block text-xs text-gray-400 mb-1">{t("Role / Course (English)")}</label>
                <input id="admin-control-12"
                  type="text"
                  value={experienceForm.role_en}
                  onChange={e => setExperienceForm({ ...experienceForm, role_en: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-control-13" className="block text-xs text-gray-400 mb-1">{t("Período / Ano")}</label>
                <input id="admin-control-13"
                  type="text" 
                  placeholder={t("Ex: 2025 - Atualmente, Conclusão: 12/2026")}
                  value={experienceForm.period}
                  onChange={e => setExperienceForm({ ...experienceForm, period: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-control-14" className="block text-xs text-gray-400 mb-1">{t("Period / Year (English)")}</label>
                <input id="admin-control-14"
                  type="text"
                  value={experienceForm.period_en}
                  onChange={e => setExperienceForm({ ...experienceForm, period_en: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-control-15" className="block text-xs text-gray-400 mb-1">{t("Tipo de Registro")}</label>
                <select id="admin-control-15"
                  value={experienceForm.type}
                  onChange={e => setExperienceForm({ ...experienceForm, type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                >
                  <option value="work">{t("Experiência profissional")}</option>
                  <option value="education">{t("Educação / Acadêmico")}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="admin-control-16" className="block text-xs text-gray-400 mb-1">{t("Tecnologias Utilizadas (Separadas por vírgula)")}</label>
                <input id="admin-control-16"
                  type="text" 
                  placeholder={t("Ex: React, Node.js, Cloudflare, Ubuntu Server")}
                  value={experienceForm.techs}
                  onChange={e => setExperienceForm({ ...experienceForm, techs: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="admin-control-17" className="block text-xs text-gray-400 mb-1">{t("Descrição / Atividades")}</label>
                <textarea id="admin-control-17"
                  placeholder={t("Descreva suas funções ou detalhes do curso...")}
                  value={experienceForm.description}
                  onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="admin-control-18" className="block text-xs text-gray-400 mb-1">{t("Description / Activities (English)")}</label>
                <textarea id="admin-control-18"
                  value={experienceForm.description_en}
                  onChange={e => setExperienceForm({ ...experienceForm, description_en: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition resize-none"
                />
              </div>
              <div>
                <label htmlFor="admin-control-19" className="block text-xs text-gray-400 mb-1">{t("Ordem de Exibição (Index)")}</label>
                <input id="admin-control-19"
                  type="number" 
                  value={experienceForm.order_index}
                  onChange={e => setExperienceForm({ ...experienceForm, order_index: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition"
                />
              </div>
              <div className="flex justify-end items-end">
                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 px-6 py-2.5 rounded-lg text-sm font-semibold transition"
                >
                  {editingExperience ? t("Salvar Alterações") : t("Cadastrar Item")}
                </button>
              </div>
            </form>

            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-gray-300 border-b border-gray-800 pb-2 mb-3">{t("Experiência profissional")}</h3>
                <div className="flex flex-col gap-3">
                  {experiences.filter(e => e.type === 'work').map(e => (
                    <div key={e.id} className="admin-experience-record flex justify-between items-start bg-gray-800/30 border border-gray-800 p-4 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-gray-200">{isEnglish ? e.role_en || e.role : e.role} {t("em")} <span className="text-teal-400">{isEnglish ? e.company_en || e.company : e.company}</span></h4>
                        <p className="text-xs text-gray-500 mb-2">{isEnglish ? e.period_en || e.period : e.period} {t("(Ordem:")} {e.order_index}{t(")")}</p>
                        <p className="text-sm text-gray-400 mb-2">{isEnglish ? e.description_en || e.description : e.description}</p>
                        <span className="text-xs text-gray-500">{t("Techs:")} {e.techs || t('Nenhuma')}</span>
                      </div>
                      <div className="flex gap-3 shrink-0 ml-4">
                        <button onClick={() => startEditExperience(e)} className="text-sm text-blue-400 hover:underline">{t("Editar")}</button>
                        <button onClick={() => handleDeleteExperience(e.id!)} className="text-sm text-red-400 hover:underline">{t("Excluir")}</button>
                      </div>
                    </div>
                  ))}
                  {!loading && !loadError && experiences.every(e => e.type !== 'work') && <p className="text-sm text-gray-400">{t("Nenhuma experiência profissional cadastrada.")}</p>}
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-300 border-b border-gray-800 pb-2 mb-3">{t("Formação acadêmica")}</h3>
                <div className="flex flex-col gap-3">
                  {experiences.filter(e => e.type === 'education').map(e => (
                    <div key={e.id} className="admin-experience-record flex justify-between items-start bg-gray-800/30 border border-gray-800 p-4 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-gray-200">{isEnglish ? e.role_en || e.role : e.role}</h4>
                        <p className="text-teal-400 text-sm mb-1">{isEnglish ? e.company_en || e.company : e.company}</p>
                        <p className="text-xs text-gray-500 mb-2">{isEnglish ? e.period_en || e.period : e.period} {t("(Ordem:")} {e.order_index}{t(")")}</p>
                        {e.description && <p className="text-sm text-gray-400">{isEnglish ? e.description_en || e.description : e.description}</p>}
                      </div>
                      <div className="flex gap-3 shrink-0 ml-4">
                        <button onClick={() => startEditExperience(e)} className="text-sm text-blue-400 hover:underline">{t("Editar")}</button>
                        <button onClick={() => handleDeleteExperience(e.id!)} className="text-sm text-red-400 hover:underline">{t("Excluir")}</button>
                      </div>
                    </div>
                  ))}
                  {!loading && !loadError && experiences.every(e => e.type !== 'education') && <p className="text-sm text-gray-400">{t("Nenhuma formação acadêmica cadastrada.")}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t("Configurações gerais")}</h2>
              <AdminNotice message={settingsMessage} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Profile Text (Bio) */}
              <div className="md:col-span-2">
                <label htmlFor="admin-control-20" className="block text-sm text-gray-400 mb-1">{t("Texto de Apresentação (Bio da Página Inicial)")}</label>
                <textarea id="admin-control-20"
                  value={settings.about_me_text || ''}
                  onChange={e => setSettings({ ...settings, about_me_text: e.target.value })}
                  placeholder={t("Desenvolvo APIs, integrações e aplicações web, com foco em backend e experiência na construção de interfaces.")}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="admin-control-21" className="block text-sm text-gray-400 mb-1">{t("Texto de apresentação em inglês")}</label>
                <textarea id="admin-control-21"
                  value={settings.about_me_text_en || ''}
                  onChange={e => setSettings({ ...settings, about_me_text_en: e.target.value })}
                  placeholder={t("I build APIs, integrations, and web applications, with a backend focus and experience building user interfaces.")}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>

              <div>
                <label htmlFor="admin-control-22" className="block text-sm text-gray-400 mb-1">{t("Texto de Disponibilidade")}</label>
                <select id="admin-control-22"
                  value={settings.availability_text || ''}
                  onChange={e => setSettings({ ...settings, availability_text: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition h-10" 
                >
                  <option value="">{t("Selecione uma opção...")}</option>
                  <option value="Disponível para oportunidades Agora">{t("Disponível para oportunidades Agora")}</option>
                  <option value="Disponível para propostas mas não buscando ativamente">{t("Disponível para propostas mas não buscando ativamente")}</option>
                  <option value="Indisponível">{t("Indisponível")}</option>
                </select>
              </div>
              <div>
                <label htmlFor="admin-control-23" className="block text-sm text-gray-400 mb-1">{t("Texto de disponibilidade em inglês")}</label>
                <input id="admin-control-23"
                  type="text"
                  value={settings.availability_text_en || ''}
                  onChange={e => setSettings({ ...settings, availability_text_en: e.target.value })}
                  placeholder={t("Available for opportunities")}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition h-10"
                />
              </div>
              <div>
                <label htmlFor="admin-control-24" className="block text-sm text-gray-400 mb-1">{t("Status Profissional Atual")}</label>
                <select id="admin-control-24"
                  value={settings.job_status_text || ''}
                  onChange={e => setSettings({ ...settings, job_status_text: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition h-10" 
                >
                  <option value="">{t("Selecione uma opção...")}</option>
                  <option value="Estagiando">{t("Estagiando")}</option>
                  <option value="Trabalhando">{t("Trabalhando")}</option>
                  <option value="Freelancer">{t("Freelancer")}</option>
                  <option value="Desempregado">{t("Desempregado")}</option>
                </select>
              </div>
              <div>
                <label htmlFor="admin-control-25" className="block text-sm text-gray-400 mb-1">{t("Status profissional em inglês")}</label>
                <input id="admin-control-25"
                  type="text"
                  value={settings.job_status_text_en || ''}
                  onChange={e => setSettings({ ...settings, job_status_text_en: e.target.value })}
                  placeholder={t("Internship")}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition h-10"
                />
              </div>

              {/* Social URLs */}
              <h3 className="md:col-span-2 text-sm font-semibold border-b border-gray-800 pb-1 mt-4 mb-1">{t("Redes sociais e contato")}</h3>

              <div>
                <label htmlFor="admin-control-26" className="block text-xs text-gray-400 mb-1">{t("URL do LinkedIn")}</label>
                <input id="admin-control-26"
                  type="url" 
                  placeholder={t("https://linkedin.com/in/usuario")}
                  value={settings.linkedin_url || ''}
                  onChange={e => setSettings({ ...settings, linkedin_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label htmlFor="admin-control-27" className="block text-xs text-gray-400 mb-1">{t("URL do GitHub")}</label>
                <input id="admin-control-27"
                  type="url" 
                  placeholder={t("https://github.com/usuario")}
                  value={settings.github_url || ''}
                  onChange={e => setSettings({ ...settings, github_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label htmlFor="admin-control-28" className="block text-xs text-gray-400 mb-1">{t("WhatsApp Link / Contato Direto")}</label>
                <input id="admin-control-28"
                  type="text" 
                  placeholder={t("https://wa.me/55999999999")}
                  value={settings.whatsapp_url || ''}
                  onChange={e => setSettings({ ...settings, whatsapp_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label htmlFor="admin-control-29" className="block text-xs text-gray-400 mb-1">{t("E-mail Público")}</label>
                <input id="admin-control-29"
                  type="email" 
                  placeholder={t("exemplo@email.com")}
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
              {t("Salvar Todas as Configurações")}
            </button>
          </div>
        )}

        </fieldset>
      </section>
    </main>
  )
}
