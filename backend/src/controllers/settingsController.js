const settingsModel = require('../models/settingsModel')
const { getPdfBase64, isHttpUrl, isValidEmail, normalizeEmail } = require('../utils/security')
const { getResumeFilename, linkExistingResumeRecords } = require('../utils/resumePairs')

const EDITABLE_SETTING_KEYS = new Set([
  'about_me_text', 'about_me_text_en',
  'availability_text', 'availability_text_en',
  'job_status_text', 'job_status_text_en',
  'resumes_description', 'resumes_description_en',
  'linkedin_url', 'github_url', 'whatsapp_url', 'contact_email'
])
const PUBLIC_SETTING_KEYS = new Set([...EDITABLE_SETTING_KEYS, 'resumes_links'])
const URL_SETTING_KEYS = new Set(['linkedin_url', 'github_url', 'whatsapp_url'])

async function getSettings(req, res) {
  try {
    const settings = await settingsModel.getAllSettings()
    const publicSettings = Object.fromEntries(
      Object.entries(settings).filter(([key]) => PUBLIC_SETTING_KEYS.has(key))
    )
    res.json(publicSettings)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar configurações' })
  }
}

async function updateSettings(req, res) {
  const settings = req.body
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return res.status(400).json({ error: 'Configurações inválidas' })
  }

  try {
    const entries = Object.entries(settings)
    for (const [key, value] of entries) {
      if (!EDITABLE_SETTING_KEYS.has(key) || typeof value !== 'string' || value.length > 5000) {
        return res.status(400).json({ error: `Configuração inválida: ${key}` })
      }
      if (URL_SETTING_KEYS.has(key) && !isHttpUrl(value)) {
        return res.status(400).json({ error: `URL inválida: ${key}` })
      }
      if (key === 'contact_email' && value && !isValidEmail(normalizeEmail(value))) {
        return res.status(400).json({ error: 'E-mail de contato inválido' })
      }
    }
    for (const [key, value] of entries) {
      await settingsModel.updateSetting(key, value)
    }
    req.io.emit('refresh_data')
    res.json({ message: 'Configurações atualizadas com sucesso' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar configurações' })
  }
}

async function getResumes() {
  const settings = await settingsModel.getAllSettings()
  try {
    return JSON.parse(settings.resumes_links || '[]')
  } catch {
    return []
  }
}

async function saveResumes(resumes) {
  await settingsModel.updateSetting('resumes_links', JSON.stringify(resumes))
}

function getGithubFileUrl(githubUsername, filename) {
  return `https://api.github.com/repos/${encodeURIComponent(githubUsername)}/portifolio/contents/frontend/public/curriculos/${encodeURIComponent(filename)}`
}

function getGithubHeaders(githubToken) {
  return {
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github.v3+json'
  }
}

async function getGithubFileSha({ githubUsername, githubToken, filename }) {
  const response = await fetch(`${getGithubFileUrl(githubUsername, filename)}?ref=main`, {
    headers: getGithubHeaders(githubToken),
    signal: AbortSignal.timeout(15 * 1000)
  })

  if (!response.ok) {
    const error = new Error(response.status === 404
      ? 'Arquivo atual do currículo não encontrado no GitHub'
      : `GitHub retornou HTTP ${response.status} ao consultar o arquivo`)
    error.status = response.status
    throw error
  }

  const file = await response.json()
  if (file.type !== 'file' || typeof file.sha !== 'string' || !file.sha) {
    const error = new Error('Resposta inválida do GitHub ao consultar o arquivo')
    error.status = 502
    throw error
  }
  return file.sha
}

async function uploadPdfToGithub({ githubUsername, githubToken, filename, base64Data, name, sha }) {
  const base64Content = getPdfBase64(base64Data)
  if (!base64Content) {
    const error = new Error('O arquivo deve ser um PDF válido com no máximo 5 MB')
    error.status = 400
    throw error
  }
  const response = await fetch(getGithubFileUrl(githubUsername, filename), {
    method: 'PUT',
    headers: {
      ...getGithubHeaders(githubToken),
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(15 * 1000),
    body: JSON.stringify({
      message: `${sha ? 'fix: substituir' : 'feat: upload'} currículo ${name} via painel admin`,
      content: base64Content,
      branch: 'main',
      ...(sha ? { sha } : {})
    })
  })

  if (!response.ok) {
    let errorData = {}
    try {
      errorData = await response.json()
    } catch {
      errorData = {}
    }
    const error = new Error(errorData.message || `GitHub retornou HTTP ${response.status}`)
    error.status = response.status
    throw error
  }
}

async function replaceResumeFile(req, res) {
  const id = Number(req.params.id)
  const { base64Data } = req.body

  if (!Number.isSafeInteger(id) || id <= 0 || typeof base64Data !== 'string') {
    return res.status(400).json({ error: 'ID e arquivo PDF válidos são obrigatórios' })
  }

  try {
    const resumes = await getResumes()
    const resume = resumes.find(item => item.id === id)
    if (!resume) {
      return res.status(404).json({ error: 'Currículo não encontrado' })
    }

    const filename = getResumeFilename(resume.url)
    if (!filename) {
      return res.status(400).json({ error: 'O currículo não possui um caminho de PDF válido' })
    }

    const githubUsername = (process.env.GITHUB_USERNAME || '').trim()
    const githubToken = (process.env.GITHUB_TOKEN || '').trim()
    if (!githubUsername || !githubToken) {
      return res.status(500).json({ error: 'Integração com GitHub não configurada' })
    }

    const sha = await getGithubFileSha({ githubUsername, githubToken, filename })
    await uploadPdfToGithub({
      githubUsername,
      githubToken,
      filename,
      base64Data,
      name: resume.name,
      sha
    })

    req.io.emit('refresh_data')
    res.json({ message: 'Arquivo do currículo substituído com sucesso', resume })
  } catch (err) {
    console.error('Erro no replaceResumeFile:', err)
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500
    res.status(status).json({ error: `Erro no GitHub: ${err.message}` })
  }
}

async function uploadResume(req, res) {
  const { portuguese, english } = req.body

  if (typeof portuguese?.name !== 'string' || typeof portuguese?.base64Data !== 'string' ||
      typeof english?.name !== 'string' || typeof english?.base64Data !== 'string' ||
      !portuguese.name.trim() || !english.name.trim() ||
      portuguese.name.length > 150 || english.name.length > 150 ||
      (typeof portuguese.description === 'string' ? portuguese.description.length : 0) > 1000 ||
      (typeof english.description === 'string' ? english.description.length : 0) > 1000) {
    return res.status(400).json({ error: 'Os currículos em português e inglês são obrigatórios' })
  }

  try {
    const githubUsername = (process.env.GITHUB_USERNAME || '').trim()
    const githubToken = (process.env.GITHUB_TOKEN || '').trim()
    if (!githubUsername || !githubToken) {
      return res.status(500).json({ error: 'Integração com GitHub não configurada' })
    }

    const pairId = Date.now()
    const portugueseFilename = `curriculo-pt-br-${pairId}.pdf`
    const englishFilename = `resume-en-${pairId}.pdf`

    await uploadPdfToGithub({
      githubUsername,
      githubToken,
      filename: portugueseFilename,
      base64Data: portuguese.base64Data,
      name: portuguese.name
    })
    await uploadPdfToGithub({
      githubUsername,
      githubToken,
      filename: englishFilename,
      base64Data: english.base64Data,
      name: english.name
    })

    const resumes = await getResumes()
    const nextOrder = resumes.reduce((highest, resume) => Math.max(highest, Number(resume.order) || 0), -1) + 1
    const newResumes = [
      {
        id: pairId,
        pairId,
        order: nextOrder,
        name: portuguese.name.trim(),
        description: typeof portuguese.description === 'string' ? portuguese.description : '',
        language: 'pt-BR',
        url: `/curriculos/${portugueseFilename}`
      },
      {
        id: pairId + 1,
        pairId,
        order: nextOrder,
        name: english.name.trim(),
        description: typeof english.description === 'string' ? english.description : '',
        language: 'en',
        url: `/curriculos/${englishFilename}`
      }
    ]

    await saveResumes([...resumes, ...newResumes])
    req.io.emit('refresh_data')
    res.json({ message: 'Par de currículos adicionado com sucesso', resumes: newResumes })
  } catch (err) {
    console.error('Erro no uploadResume:', err)
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500
    res.status(status).json({ error: `Erro no GitHub: ${err.message}` })
  }
}

async function uploadResumeCounterpart(req, res) {
  const id = Number(req.params.id)
  const { name, description, base64Data } = req.body

  if (!Number.isFinite(id) || typeof name !== 'string' || !name.trim() || name.length > 150 ||
      typeof base64Data !== 'string' ||
      (typeof description === 'string' ? description.length : 0) > 1000) {
    return res.status(400).json({ error: 'Nome e arquivo da versão ausente são obrigatórios' })
  }

  try {
    const resumes = await getResumes()
    const selectedIndex = resumes.findIndex(resume => resume.id === id)
    if (selectedIndex === -1) {
      return res.status(404).json({ error: 'Currículo original não encontrado' })
    }

    const selected = resumes[selectedIndex]
    const selectedLanguage = selected.language || 'pt-BR'
    const missingLanguage = selectedLanguage === 'en' ? 'pt-BR' : 'en'
    const pairId = selected.pairId || selected.id
    const counterpartExists = resumes.some(resume =>
      String(resume.pairId || resume.id) === String(pairId) &&
      (resume.language || 'pt-BR') === missingLanguage
    )

    if (counterpartExists) {
      return res.status(409).json({ error: 'Este currículo já possui as duas versões' })
    }

    const githubUsername = (process.env.GITHUB_USERNAME || '').trim()
    const githubToken = (process.env.GITHUB_TOKEN || '').trim()
    if (!githubUsername || !githubToken) {
      return res.status(500).json({ error: 'Integração com GitHub não configurada' })
    }

    let newId = Date.now()
    while (resumes.some(resume => resume.id === newId)) newId += 1

    const filename = missingLanguage === 'en'
      ? `resume-en-${newId}.pdf`
      : `curriculo-pt-br-${newId}.pdf`

    await uploadPdfToGithub({
      githubUsername,
      githubToken,
      filename,
      base64Data,
      name
    })

    const parsedOrder = Number(selected.order)
    const order = Number.isFinite(parsedOrder) ? parsedOrder : selectedIndex
    const updatedOriginal = { ...selected, pairId, order, language: selectedLanguage }
    const counterpart = {
      id: newId,
      pairId,
      order,
      name: name.trim(),
      description: typeof description === 'string' ? description : '',
      language: missingLanguage,
      url: `/curriculos/${filename}`
    }
    const updated = resumes.map((resume, index) => index === selectedIndex ? updatedOriginal : resume)
    updated.push(counterpart)

    await saveResumes(updated)
    req.io.emit('refresh_data')
    res.json({ message: 'Versão ausente adicionada com sucesso', resume: counterpart })
  } catch (err) {
    console.error('Erro no uploadResumeCounterpart:', err)
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500
    res.status(status).json({ error: `Erro no GitHub: ${err.message}` })
  }
}

async function linkResumeCounterparts(req, res) {
  const portugueseId = Number(req.body.portugueseId)
  const englishId = Number(req.body.englishId)

  if (!Number.isInteger(portugueseId) || !Number.isInteger(englishId) ||
      portugueseId <= 0 || englishId <= 0 || portugueseId === englishId) {
    return res.status(400).json({ error: 'Selecione dois currículos válidos e diferentes' })
  }

  try {
    const resumes = await getResumes()
    const { updated, pairId } = linkExistingResumeRecords(resumes, portugueseId, englishId)

    await saveResumes(updated)
    req.io.emit('refresh_data')
    res.json({ message: 'Currículos existentes vinculados com sucesso', pairId })
  } catch (err) {
    const status = Number.isInteger(err.status) ? err.status : 500
    res.status(status).json({ error: status === 500 ? 'Erro ao vincular os currículos existentes' : err.message })
  }
}

async function reorderResumePairs(req, res) {
  const { pairIds } = req.body
  if (!Array.isArray(pairIds)) {
    return res.status(400).json({ error: 'Ordem inválida' })
  }

  try {
    const resumes = await getResumes()
    const currentPairIds = [...new Set(resumes.map(resume => String(resume.pairId || resume.id)))]
    const requestedPairIds = pairIds.map(String)
    const hasEveryPair = requestedPairIds.length === currentPairIds.length &&
      new Set(requestedPairIds).size === currentPairIds.length &&
      currentPairIds.every(pairId => requestedPairIds.includes(pairId))

    if (!hasEveryPair) {
      return res.status(400).json({ error: 'A nova ordem deve incluir cada par uma única vez' })
    }

    const orderByPair = new Map(pairIds.map((pairId, index) => [String(pairId), index]))
    const updated = resumes.map(resume => {
      const pairKey = String(resume.pairId || resume.id)
      return orderByPair.has(pairKey) ? { ...resume, order: orderByPair.get(pairKey) } : resume
    })
    await saveResumes(updated)
    req.io.emit('refresh_data')
    res.json({ message: 'Ordem dos currículos atualizada' })
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar a ordem dos currículos' })
  }
}

async function removeResumePair(req, res) {
  const pairId = String(req.params.pairId)
  try {
    const resumes = await getResumes()
    const updated = resumes.filter(resume => String(resume.pairId || resume.id) !== pairId)
    await saveResumes(updated)
    req.io.emit('refresh_data')
    res.json({ message: 'Par de currículos removido com sucesso' })
  } catch {
    res.status(500).json({ error: 'Erro ao remover o par de currículos' })
  }
}

async function removeResume(req, res) {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de currículo inválido' })
  }
  try {
    const resumes = await getResumes()
    const selectedResume = resumes.find(resume => resume.id === id)
    if (!selectedResume) {
      return res.status(404).json({ error: 'Currículo não encontrado' })
    }

    const pairId = selectedResume.pairId || selectedResume.id
    const updated = resumes.filter(resume => (resume.pairId || resume.id) !== pairId)
    await saveResumes(updated)
    req.io.emit('refresh_data')
    res.json({ message: 'Par de currículos removido com sucesso' })
  } catch {
    res.status(500).json({ error: 'Erro interno ao remover currículo' })
  }
}

async function editResume(req, res) {
  const id = Number(req.params.id)
  const { name, description, language = 'pt-BR' } = req.body
  const normalizedDescription = typeof description === 'string' ? description : ''

  if (!Number.isSafeInteger(id) || id <= 0 || typeof name !== 'string' || !name.trim() || name.length > 150 || normalizedDescription.length > 1000) {
    return res.status(400).json({ error: 'O nome é obrigatório' })
  }


  if (!['pt-BR', 'en'].includes(language)) {
    return res.status(400).json({ error: 'Idioma do currículo inválido' })
  }

  try {
    const resumes = await getResumes()

    const resumeIndex = resumes.findIndex(r => r.id === id)
    if (resumeIndex === -1) {
      return res.status(404).json({ error: 'Currículo não encontrado' })
    }

    resumes[resumeIndex].name = name.trim()
    resumes[resumeIndex].description = normalizedDescription
    // A versão de um par não pode trocar de idioma e deixar o par inconsistente.
    if (!resumes[resumeIndex].pairId) {
      resumes[resumeIndex].language = language
    }

    await saveResumes(resumes)
    req.io.emit('refresh_data')
    
    res.json({ message: 'Currículo atualizado com sucesso', resume: resumes[resumeIndex] })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao atualizar currículo' })
  }
}

module.exports = { getSettings, updateSettings, uploadResume, uploadResumeCounterpart, replaceResumeFile, linkResumeCounterparts, reorderResumePairs, removeResumePair, removeResume, editResume }
