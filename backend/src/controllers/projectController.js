const projectModel = require('../models/projectModel')
const dbMonitor = require('../services/dbMonitor')
const { isHttpUrl } = require('../utils/security')

const PROJECT_STATUSES = new Set(['concluido', 'em_andamento', 'pausado'])

function validateProject(data) {
  if (!data || typeof data !== 'object') return false
  if (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 100) return false
  if (typeof data.title_en !== 'string' || !data.title_en.trim() || data.title_en.length > 100) return false
  if (typeof data.description !== 'string' || data.description.length > 5000) return false
  if (typeof data.description_en !== 'string' || data.description_en.length > 5000) return false
  if (!Array.isArray(data.tech_stack) || data.tech_stack.length > 30 ||
      data.tech_stack.some(tech => typeof tech !== 'string' || !tech.trim() || tech.length > 50)) return false
  if (!isHttpUrl(data.github_url) || !isHttpUrl(data.live_url)) return false
  if (!isHttpUrl(data.thumbnail)) return false
  if (typeof data.featured !== 'boolean') return false
  if (!PROJECT_STATUSES.has(data.status || 'concluido')) return false
  return true
}

function parseProjectId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * Retorna todos os projetos cadastrados no banco.
 */
async function getAll(req, res) {
  try {
    const projects = await projectModel.getAll()
    dbMonitor.notifyRecovery()
    res.json(projects)
  } catch (err) {
    dbMonitor.notifyFailure(err)
    res.status(500).json({ error: 'Erro ao buscar projetos' })
  }
}

/**
 * Retorna apenas os projetos marcados como destaque (featured = true).
 */
async function getFeatured(req, res) {
  try {
    const projects = await projectModel.getFeatured()
    dbMonitor.notifyRecovery()
    res.json(projects)
  } catch (err) {
    dbMonitor.notifyFailure(err)
    res.status(500).json({ error: 'Erro ao buscar projetos em destaque' })
  }
}

/**
 * Retorna um projeto específico pelo seu ID.
 */
async function getById(req, res) {
  const id = parseProjectId(req.params.id)
  if (!id) return res.status(400).json({ error: 'ID de projeto inválido' })
  try {
    const project = await projectModel.getById(id)
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' })
    res.json(project)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projeto' })
  }
}

/**
 * Cria um novo projeto no banco de dados e notifica os clientes.
 */
async function create(req, res) {
  if (!validateProject(req.body)) {
    return res.status(400).json({ error: 'Dados do projeto inválidos ou incompletos' })
  }
  try {
    const id = await projectModel.create(req.body)
    req.io.emit('refresh_data')
    res.status(201).json({ id })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar projeto' })
  }
}

/**
 * Atualiza os dados de um projeto existente e notifica os clientes.
 */
async function update(req, res) {
  const id = parseProjectId(req.params.id)
  if (!id || !validateProject(req.body)) {
    return res.status(400).json({ error: 'Dados do projeto inválidos ou incompletos' })
  }
  try {
    await projectModel.update(id, req.body)
    req.io.emit('refresh_data')
    res.json({ message: 'Projeto atualizado!' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar projeto' })
  }
}

/**
 * Remove um projeto do banco de dados e notifica os clientes.
 */
async function remove(req, res) {
  const id = parseProjectId(req.params.id)
  if (!id) return res.status(400).json({ error: 'ID de projeto inválido' })
  try {
    await projectModel.remove(id)
    req.io.emit('refresh_data')
    res.json({ message: 'Projeto deletado!' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar projeto' })
  }
}

module.exports = { getAll, getFeatured, getById, create, update, remove }
