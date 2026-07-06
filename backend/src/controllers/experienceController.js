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
  const { company, role, period, description, techs, type, order_index } = req.body
  if (!company || !role || !period) {
    return res.status(400).json({ error: 'Empresa, cargo e período são obrigatórios' })
  }

  try {
    const id = await experienceModel.create({ company, role, period, description, techs, type, order_index })
    req.io.emit('refresh_data')
    res.status(201).json({ id, company, role, period, description, techs, type, order_index })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar experiência' })
  }
}

async function updateExperience(req, res) {
  const id = parseInt(req.params.id)
  const { company, role, period, description, techs, type, order_index } = req.body
  if (!company || !role || !period) {
    return res.status(400).json({ error: 'Empresa, cargo e período são obrigatórios' })
  }

  try {
    await experienceModel.update(id, { company, role, period, description, techs, type, order_index })
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
