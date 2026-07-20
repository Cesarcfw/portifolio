const settingsModel = require('../models/settingsModel')

async function getSettings(req, res) {
  try {
    const settings = await settingsModel.getAllSettings()
    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar configurações' })
  }
}

async function updateSettings(req, res) {
  const settings = req.body
  try {
    for (const [key, value] of Object.entries(settings)) {
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

async function uploadPdfToGithub({ githubUsername, githubToken, filename, base64Data, name }) {
  const base64Content = base64Data.split(',')[1] || base64Data
  const githubUrl = `https://api.github.com/repos/${githubUsername}/portifolio/contents/frontend/public/curriculos/${filename}`
  const response = await fetch(githubUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      message: `feat: upload currículo ${name} via painel admin`,
      content: base64Content,
      branch: 'main'
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

async function uploadResume(req, res) {
  const { portuguese, english } = req.body

  if (!portuguese?.name || !portuguese?.base64Data || !english?.name || !english?.base64Data) {
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
        name: portuguese.name,
        description: portuguese.description || '',
        language: 'pt-BR',
        url: `/curriculos/${portugueseFilename}`
      },
      {
        id: pairId + 1,
        pairId,
        order: nextOrder,
        name: english.name,
        description: english.description || '',
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
  const id = parseInt(req.params.id)
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
  const id = parseInt(req.params.id)
  const { name, description, language = 'pt-BR' } = req.body

  if (!name) {
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

    resumes[resumeIndex].name = name
    resumes[resumeIndex].description = description || ''
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

module.exports = { getSettings, updateSettings, uploadResume, reorderResumePairs, removeResumePair, removeResume, editResume }
