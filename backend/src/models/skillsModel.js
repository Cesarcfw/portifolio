const pool = require('../database/connection')

async function getAll() {
  const [rows] = await pool.query('SELECT * FROM skills ORDER BY name ASC')
  return rows
}

async function create(data) {
  const { name, category, level, color } = data
  const [result] = await pool.query(
    'INSERT INTO skills (name, category, level, color) VALUES (?, ?, ?, ?)',
    [name, category, level ?? 80, color ?? '#00f0ff']
  )
  return result.insertId
}

async function update(id, data) {
  const { name, category, level, color } = data
  await pool.query(
    'UPDATE skills SET name = ?, category = ?, level = ?, color = ? WHERE id = ?',
    [name, category, level ?? 80, color ?? '#00f0ff', id]
  )
}

async function remove(id) {
  await pool.query('DELETE FROM skills WHERE id = ?', [id])
}

module.exports = { getAll, create, update, remove }
