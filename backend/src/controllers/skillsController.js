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
  const { name, name_en, category, category_en, level, color } = req.body
  if (!name || !name_en || !category || !category_en) {
    return res.status(400).json({ error: 'Nome e categoria são obrigatórios em português e inglês' })
  }

  try {
    const id = await skillsModel.create({ name, name_en, category, category_en, level, color })
    req.io.emit('refresh_data')
    res.status(201).json({ id, name, name_en, category, category_en, level, color })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar habilidade' })
  }
}

async function updateSkill(req, res) {
  const id = parseInt(req.params.id)
  const { name, name_en, category, category_en, level, color } = req.body
  if (!name || !name_en || !category || !category_en) {
    return res.status(400).json({ error: 'Nome e categoria são obrigatórios em português e inglês' })
  }

  try {
    await skillsModel.update(id, { name, name_en, category, category_en, level, color })
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
