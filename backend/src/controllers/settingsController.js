const settingsModel = require('../models/settingsModel')
const { getPdfBase64, isHttpUrl, isValidEmail, normalizeEmail } = require('../utils/security')
const { getResumeFilename, linkExistingResumeRecords } = require('../utils/resumePairs')
const { respondError, respondDatabaseError, classifyGithubError } = require('../utils/apiErrors')

function respondResumeUploadError(req, res, err) {
  if (err.status === 400) return respondError(req, res, 'RESUME_INVALID_PDF')
  if (err.upstreamStatus === 404 && err.operation === 'lookup') return respondError(req, res, 'RESUME_FILE_NOT_FOUND')
  if (err.source === 'database') return respondDatabaseError(req, res, err)
  if (err.branchProtected) return respondError(req, res, 'GITHUB_BRANCH_PROTECTED', { cause: err, upstreamStatus: err.upstreamStatus, log: true })
  if (err.upstreamStatus === 409) return respondError(req, res, 'GITHUB_FILE_CONFLICT', { cause: err, upstreamStatus: 409, log: true })
  const code = classifyGithubError(err)
  return respondError(req, res, code === 'GITHUB_UPSTREAM_ERROR' ? 'RESUME_UPLOAD_FAILED' : code, {
    cause: err,
    upstreamStatus: err.upstreamStatus
  })
}

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
    respondDatabaseError(req, res, err)
  }
}

async function updateSettings(req, res) {
  const settings = req.body
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return respondError(req, res, 'INVALID_INPUT', { message: 'Configurações inválidas' })
  }

  try {
    const entries = Object.entries(settings)
    for (const [key, value] of entries) {
      if (!EDITABLE_SETTING_KEYS.has(key) || typeof value !== 'string' || value.length > 5000) {
        return respondError(req, res, 'INVALID_INPUT', { message: `Configuração inválida: ${key}` })
      }
      if (URL_SETTING_KEYS.has(key) && !isHttpUrl(value)) {
        return respondError(req, res, 'INVALID_INPUT', { message: `URL inválida: ${key}` })
      }
      if (key === 'contact_email' && value && !isValidEmail(normalizeEmail(value))) {
        return respondError(req, res, 'INVALID_INPUT', { message: 'E-mail de contato inválido' })
      }
    }
    for (const [key, value] of entries) {
      await settingsModel.updateSetting(key, value)
    }
    req.io.emit('refresh_data')
    res.json({ message: 'Configurações atualizadas com sucesso' })
  } catch (err) {
    respondDatabaseError(req, res, err)
  }
}

async function getResumes() {
  let settings
  try {
    settings = await settingsModel.getAllSettings()
  } catch (err) {
    err.source = 'database'
    throw err
  }
  try {
    return JSON.parse(settings.resumes_links || '[]')
  } catch {
    return []
  }
}

async function saveResumes(resumes) {
  try {
    await settingsModel.updateSetting('resumes_links', JSON.stringify(resumes))
  } catch (err) {
    err.source = 'database'
    throw err
  }
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
    error.upstreamStatus = response.status
    error.rateLimited = response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0'
    error.operation = 'lookup'
    throw error
  }

  const file = await response.json()
  if (file.type !== 'file' || typeof file.sha !== 'string' || !file.sha) {
    const error = new Error('Resposta inválida do GitHub ao consultar o arquivo')
    error.upstreamStatus = 502
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
    error.upstreamStatus = response.status
    error.rateLimited = response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0'
    error.operation = 'upload'
    error.branchProtected = /repository rule violations|changes must be made through a pull request/i.test(errorData.message || '')
    throw error
  }
}

async function replaceResumeFile(req, res) {
  const id = Number(req.params.id)
  const { base64Data } = req.body

  if (!Number.isSafeInteger(id) || id <= 0 || typeof base64Data !== 'string') {
    return respondError(req, res, 'INVALID_INPUT', { message: 'ID e arquivo PDF válidos são obrigatórios' })
  }

  try {
    const resumes = await getResumes()
    const resume = resumes.find(item => item.id === id)
    if (!resume) {
      return respondError(req, res, 'RESUME_NOT_FOUND')
    }

    const filename = getResumeFilename(resume.url)
    if (!filename) {
      return respondError(req, res, 'RESUME_INVALID_PDF', { message: 'O currículo não possui um caminho de PDF válido' })
    }

    const githubUsername = (process.env.GITHUB_USERNAME || '').trim()
    const githubToken = (process.env.GITHUB_TOKEN || '').trim()
    if (!githubUsername || !githubToken) {
      return respondError(req, res, 'GITHUB_NOT_CONFIGURED')
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
    respondResumeUploadError(req, res, err)
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
    return respondError(req, res, 'RESUME_PAIR_INVALID', { message: 'Os currículos em português e inglês são obrigatórios' })
  }

  try {
    const githubUsername = (process.env.GITHUB_USERNAME || '').trim()
    const githubToken = (process.env.GITHUB_TOKEN || '').trim()
    if (!githubUsername || !githubToken) {
      return respondError(req, res, 'GITHUB_NOT_CONFIGURED')
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
    respondResumeUploadError(req, res, err)
  }
}

async function uploadResumeCounterpart(req, res) {
  const id = Number(req.params.id)
  const { name, description, base64Data } = req.body

  if (!Number.isFinite(id) || typeof name !== 'string' || !name.trim() || name.length > 150 ||
      typeof base64Data !== 'string' ||
      (typeof description === 'string' ? description.length : 0) > 1000) {
    return respondError(req, res, 'INVALID_INPUT', { message: 'Nome e arquivo da versão ausente são obrigatórios' })
  }

  try {
    const resumes = await getResumes()
    const selectedIndex = resumes.findIndex(resume => resume.id === id)
    if (selectedIndex === -1) {
      return respondError(req, res, 'RESUME_NOT_FOUND', { message: 'Currículo original não encontrado' })
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
      return respondError(req, res, 'RESUME_PAIR_CONFLICT', { message: 'Este currículo já possui as duas versões' })
    }

    const githubUsername = (process.env.GITHUB_USERNAME || '').trim()
    const githubToken = (process.env.GITHUB_TOKEN || '').trim()
    if (!githubUsername || !githubToken) {
      return respondError(req, res, 'GITHUB_NOT_CONFIGURED')
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
    respondResumeUploadError(req, res, err)
  }
}

async function linkResumeCounterparts(req, res) {
  const portugueseId = Number(req.body.portugueseId)
  const englishId = Number(req.body.englishId)

  if (!Number.isInteger(portugueseId) || !Number.isInteger(englishId) ||
      portugueseId <= 0 || englishId <= 0 || portugueseId === englishId) {
    return respondError(req, res, 'RESUME_PAIR_INVALID', { message: 'Selecione dois currículos válidos e diferentes' })
  }

  try {
    const resumes = await getResumes()
    const { updated, pairId } = linkExistingResumeRecords(resumes, portugueseId, englishId)

    await saveResumes(updated)
    req.io.emit('refresh_data')
    res.json({ message: 'Currículos existentes vinculados com sucesso', pairId })
  } catch (err) {
    if (err.status === 400) return respondError(req, res, 'RESUME_PAIR_INVALID', { message: err.message })
    if (err.status === 404) return respondError(req, res, 'RESUME_NOT_FOUND', { message: err.message })
    if (err.status === 409) return respondError(req, res, 'RESUME_PAIR_CONFLICT', { message: err.message })
    respondDatabaseError(req, res, err)
  }
}

async function reorderResumePairs(req, res) {
  const { pairIds } = req.body
  if (!Array.isArray(pairIds)) {
    return respondError(req, res, 'RESUME_PAIR_INVALID', { message: 'Ordem inválida' })
  }

  try {
    const resumes = await getResumes()
    const currentPairIds = [...new Set(resumes.map(resume => String(resume.pairId || resume.id)))]
    const requestedPairIds = pairIds.map(String)
    const hasEveryPair = requestedPairIds.length === currentPairIds.length &&
      new Set(requestedPairIds).size === currentPairIds.length &&
      currentPairIds.every(pairId => requestedPairIds.includes(pairId))

    if (!hasEveryPair) {
      return respondError(req, res, 'RESUME_PAIR_INVALID', { message: 'A nova ordem deve incluir cada par uma única vez' })
    }

    const orderByPair = new Map(pairIds.map((pairId, index) => [String(pairId), index]))
    const updated = resumes.map(resume => {
      const pairKey = String(resume.pairId || resume.id)
      return orderByPair.has(pairKey) ? { ...resume, order: orderByPair.get(pairKey) } : resume
    })
    await saveResumes(updated)
    req.io.emit('refresh_data')
    res.json({ message: 'Ordem dos currículos atualizada' })
  } catch (err) {
    respondDatabaseError(req, res, err)
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
  } catch (err) {
    respondDatabaseError(req, res, err)
  }
}

async function removeResume(req, res) {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id <= 0) {
    return respondError(req, res, 'INVALID_INPUT', { message: 'ID de currículo inválido' })
  }
  try {
    const resumes = await getResumes()
    const selectedResume = resumes.find(resume => resume.id === id)
    if (!selectedResume) {
      return respondError(req, res, 'RESUME_NOT_FOUND')
    }

    const pairId = selectedResume.pairId || selectedResume.id
    const updated = resumes.filter(resume => (resume.pairId || resume.id) !== pairId)
    await saveResumes(updated)
    req.io.emit('refresh_data')
    res.json({ message: 'Par de currículos removido com sucesso' })
  } catch (err) {
    respondDatabaseError(req, res, err)
  }
}

async function editResume(req, res) {
  const id = Number(req.params.id)
  const { name, description, language = 'pt-BR' } = req.body
  const normalizedDescription = typeof description === 'string' ? description : ''

  if (!Number.isSafeInteger(id) || id <= 0 || typeof name !== 'string' || !name.trim() || name.length > 150 || normalizedDescription.length > 1000) {
    return respondError(req, res, 'INVALID_INPUT', { message: 'O nome é obrigatório' })
  }


  if (!['pt-BR', 'en'].includes(language)) {
    return respondError(req, res, 'INVALID_INPUT', { message: 'Idioma do currículo inválido' })
  }

  try {
    const resumes = await getResumes()

    const resumeIndex = resumes.findIndex(r => r.id === id)
    if (resumeIndex === -1) {
      return respondError(req, res, 'RESUME_NOT_FOUND')
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
    respondDatabaseError(req, res, err)
  }
}

module.exports = { getSettings, updateSettings, uploadResume, uploadResumeCounterpart, replaceResumeFile, linkResumeCounterparts, reorderResumePairs, removeResumePair, removeResume, editResume }
