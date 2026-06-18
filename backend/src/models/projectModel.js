const pool = require('../database/connection')

async function getAll() {
  const [rows] = await pool.query(
    'SELECT * FROM projects ORDER BY created_at DESC'
  )
  return rows
}

async function getFeatured() {
  const [rows] = await pool.query(
    'SELECT * FROM projects WHERE featured = true ORDER BY created_at DESC'
  )
  return rows
}

async function getById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM projects WHERE id = ?', [id]
  )
  return rows[0]
}

async function create(data) {
  const { title, description, tech_stack, github_url, live_url, thumbnail, featured, status } = data
  const [result] = await pool.query(
    `INSERT INTO projects 
     (title, description, tech_stack, github_url, live_url, thumbnail, featured, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, JSON.stringify(tech_stack), github_url, live_url, thumbnail, featured ?? false, status ?? 'concluido']
  )
  return result.insertId
}

async function update(id, data) {
  const { title, description, tech_stack, github_url, live_url, thumbnail, featured, status } = data
  await pool.query(
    `UPDATE projects SET 
     title = ?, description = ?, tech_stack = ?, 
     github_url = ?, live_url = ?, thumbnail = ?, featured = ?, status = ?
     WHERE id = ?`,
    [title, description, JSON.stringify(tech_stack), github_url, live_url, thumbnail, featured, status ?? 'concluido', id]
  )
}

async function remove(id) {
  await pool.query('DELETE FROM projects WHERE id = ?', [id])
}

module.exports = { getAll, getFeatured, getById, create, update, remove }