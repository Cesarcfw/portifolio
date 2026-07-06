const skillsModel = require('../models/skillsModel')

async function getSkills(req, res) {
  try {
    const skills = await skillsModel.getAll()
    res.json(skills)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar habilidades' })
  }
}

async function createSkill(req, res) {
  const { name, category, level, color } = req.body
  if (!name || !category) {
    return res.status(400).json({ error: 'Nome e categoria são obrigatórios' })
  }

  try {
    const id = await skillsModel.create({ name, category, level, color })
    req.io.emit('refresh_data')
    res.status(201).json({ id, name, category, level, color })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar habilidade' })
  }
}

async function updateSkill(req, res) {
  const id = parseInt(req.params.id)
  const { name, category, level, color } = req.body
  if (!name || !category) {
    return res.status(400).json({ error: 'Nome e categoria são obrigatórios' })
  }

  try {
    await skillsModel.update(id, { name, category, level, color })
    req.io.emit('refresh_data')
    res.json({ message: 'Habilidade atualizada com sucesso' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar habilidade' })
  }
}

async function removeSkill(req, res) {
  const id = parseInt(req.params.id)
  try {
    await skillsModel.remove(id)
    req.io.emit('refresh_data')
    res.json({ message: 'Habilidade removida com sucesso' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover habilidade' })
  }
}

module.exports = { getSkills, createSkill, updateSkill, removeSkill }
