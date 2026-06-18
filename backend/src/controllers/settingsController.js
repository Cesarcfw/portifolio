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

module.exports = { getSettings, updateSettings }
