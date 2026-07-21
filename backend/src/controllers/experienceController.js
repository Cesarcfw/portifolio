const experienceModel = require('../models/experienceModel')

function isValidExperience(data) {
  const mainFields = [data.company, data.company_en, data.role, data.role_en]
  const periodFields = [data.period, data.period_en]
  return mainFields.every(value => typeof value === 'string' && value.trim() && value.length <= 100) &&
    periodFields.every(value => typeof value === 'string' && value.trim() && value.length <= 50) &&
    (data.description === undefined || (typeof data.description === 'string' && data.description.length <= 5000)) &&
    (data.description_en === undefined || (typeof data.description_en === 'string' && data.description_en.length <= 5000)) &&
    (data.techs === undefined || (typeof data.techs === 'string' && data.techs.length <= 255)) &&
    ['work', 'education'].includes(data.type || 'work') &&
    (data.order_index === undefined || (
      Number.isSafeInteger(Number(data.order_index)) &&
      Number(data.order_index) >= -1000000 && Number(data.order_index) <= 1000000
    ))
}

async function getExperiences(req, res) {
  try {
    const experiences = await experienceModel.getAll()
    res.json(experiences)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar experiências' })
  }
}

async function createExperience(req, res) {
  const { company, company_en, role, role_en, period, period_en, description, description_en, techs, type, order_index } = req.body
  if (!isValidExperience(req.body)) {
    return res.status(400).json({ error: 'Dados da experiência inválidos ou incompletos' })
  }

  try {
    const id = await experienceModel.create({ company, company_en, role, role_en, period, period_en, description, description_en, techs, type, order_index })
    req.io.emit('refresh_data')
    res.status(201).json({ id, company, company_en, role, role_en, period, period_en, description, description_en, techs, type, order_index })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar experiência' })
  }
}

async function updateExperience(req, res) {
  const id = Number(req.params.id)
  const { company, company_en, role, role_en, period, period_en, description, description_en, techs, type, order_index } = req.body
  if (!Number.isInteger(id) || id <= 0 || !isValidExperience(req.body)) {
    return res.status(400).json({ error: 'Dados da experiência inválidos ou incompletos' })
  }

  try {
    await experienceModel.update(id, { company, company_en, role, role_en, period, period_en, description, description_en, techs, type, order_index })
    req.io.emit('refresh_data')
    res.json({ message: 'Experiência atualizada com sucesso' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar experiência' })
  }
}

async function removeExperience(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' })
  try {
    await experienceModel.remove(id)
    req.io.emit('refresh_data')
    res.json({ message: 'Experiência removida com sucesso' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover experiência' })
  }
}

module.exports = { getExperiences, createExperience, updateExperience, removeExperience }
