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

async function uploadResume(req, res) {
  const { name, base64Data } = req.body

  if (!name || !base64Data) {
    return res.status(400).json({ error: 'Nome e arquivo são obrigatórios' })
  }

  try {
    // 1. Limpar a string base64 (remover 'data:application/pdf;base64,')
    const base64Content = base64Data.split(',')[1] || base64Data
    const githubUsername = (process.env.GITHUB_USERNAME || '').trim()
    const githubToken = (process.env.GITHUB_TOKEN || '').trim()
    
    // 2. Fazer o commit no GitHub (vai ativar o deploy na Vercel)
    const githubUrl = `https://api.github.com/repos/${githubUsername}/portifolio/contents/frontend/public/${filename}`
    
    const githubResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `feat: upload currículo ${name} via painel admin`,
        content: base64Content,
        branch: 'main'
      })
    })

    if (!githubResponse.ok) {
      let errorData;
      try {
        errorData = await githubResponse.json()
      } catch(e) {
        throw new Error(`GitHub retornou HTTP ${githubResponse.status} mas não era JSON.`)
      }
      console.error('Erro GitHub:', errorData)
      return res.status(githubResponse.status).json({ 
        error: `Erro no GitHub: ${errorData.message || 'Token inválido ou sem permissão'}` 
      })
    }

    // 3. Atualizar o banco de dados (settings)
    // Primeiro, buscamos os currículos atuais
    const currentSettingsArray = await settingsModel.getAllSettings()
    // currentSettingsArray é no formato { key: value }?
    // Vamos verificar o getAllSettings. Retorna um objeto de chave/valor.
    const resumesJson = currentSettingsArray.resumes_links || '[]'
    let resumes = []
    try { resumes = JSON.parse(resumesJson) } catch(e) {}

    const newResume = {
      id: Date.now(),
      name: name,
      url: `/${filename}` // Link relativo que a Vercel vai resolver
    }

    resumes.push(newResume)

    // Atualiza a key
    await settingsModel.updateSetting('resumes_links', JSON.stringify(resumes))
    req.io.emit('refresh_data')

    res.json({ message: 'Currículo adicionado com sucesso', resume: newResume })
  } catch (err) {
    console.error('Erro no uploadResume:', err)
    res.status(500).json({ error: `Erro interno: ${err.message}` })
  }
}

async function removeResume(req, res) {
  const { id } = req.params

  try {
    const currentSettingsArray = await settingsModel.getAllSettings()
    const resumesJson = currentSettingsArray.resumes_links || '[]'
    let resumes = []
    try { resumes = JSON.parse(resumesJson) } catch(e) {}

    const updatedResumes = resumes.filter(r => r.id !== parseInt(id))
    
    // Obs: não vamos deletar o arquivo do GitHub para simplificar, apenas removemos do banco
    await settingsModel.updateSetting('resumes_links', JSON.stringify(updatedResumes))
    req.io.emit('refresh_data')

    res.json({ message: 'Currículo removido com sucesso' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover currículo' })
  }
}

module.exports = { getSettings, updateSettings, uploadResume, removeResume }
