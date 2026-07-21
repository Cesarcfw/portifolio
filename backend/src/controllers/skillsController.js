const skillsModel = require('../models/skillsModel')

function isValidSkill({ name, name_en, category, category_en, level, color }) {
  return [name, name_en, category, category_en].every(value =>
    typeof value === 'string' && value.trim() && value.length <= 50
  ) && (level === undefined || (Number.isInteger(Number(level)) && Number(level) >= 0 && Number(level) <= 100)) &&
    (color === undefined || (typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)))
}

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
  if (!isValidSkill({ name, name_en, category, category_en, level, color })) {
    return res.status(400).json({ error: 'Dados da habilidade inválidos ou incompletos' })
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
  const id = Number(req.params.id)
  const { name, name_en, category, category_en, level, color } = req.body
  if (!Number.isInteger(id) || id <= 0 || !isValidSkill({ name, name_en, category, category_en, level, color })) {
    return res.status(400).json({ error: 'Dados da habilidade inválidos ou incompletos' })
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
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' })
  try {
    await skillsModel.remove(id)
    req.io.emit('refresh_data')
    res.json({ message: 'Habilidade removida com sucesso' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover habilidade' })
  }
}

module.exports = { getSkills, createSkill, updateSkill, removeSkill }
