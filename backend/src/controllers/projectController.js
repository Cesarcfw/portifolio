const projectModel = require('../models/projectModel')

/**
 * Retorna todos os projetos cadastrados no banco.
 */
async function getAll(req, res) {
  try {
    const projects = await projectModel.getAll()
    res.json(projects)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projetos' })
  }
}

/**
 * Retorna apenas os projetos marcados como destaque (featured = true).
 */
async function getFeatured(req, res) {
  try {
    const projects = await projectModel.getFeatured()
    res.json(projects)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projetos em destaque' })
  }
}

/**
 * Retorna um projeto específico pelo seu ID.
 */
async function getById(req, res) {
  try {
    const project = await projectModel.getById(req.params.id)
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
  try {
    await projectModel.update(req.params.id, req.body)
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
  try {
    await projectModel.remove(req.params.id)
    req.io.emit('refresh_data')
    res.json({ message: 'Projeto deletado!' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar projeto' })
  }
}

module.exports = { getAll, getFeatured, getById, create, update, remove }