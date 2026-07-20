const experienceModel = require('../models/experienceModel')

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
  if (!company || !company_en || !role || !role_en || !period || !period_en) {
    return res.status(400).json({ error: 'Empresa, cargo e período são obrigatórios em português e inglês' })
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
  const id = parseInt(req.params.id)
  const { company, company_en, role, role_en, period, period_en, description, description_en, techs, type, order_index } = req.body
  if (!company || !company_en || !role || !role_en || !period || !period_en) {
    return res.status(400).json({ error: 'Empresa, cargo e período são obrigatórios em português e inglês' })
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
  const id = parseInt(req.params.id)
  try {
    await experienceModel.remove(id)
    req.io.emit('refresh_data')
    res.json({ message: 'Experiência removida com sucesso' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover experiência' })
  }
}

module.exports = { getExperiences, createExperience, updateExperience, removeExperience }
