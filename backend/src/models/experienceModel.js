const pool = require('../database/connection')

async function getAll() {
  const [rows] = await pool.query('SELECT * FROM experiences ORDER BY order_index ASC, id DESC')
  return rows
}

async function create(data) {
  const { company, company_en, role, role_en, period, period_en, description, description_en, techs, type, order_index } = data
  const [result] = await pool.query(
    'INSERT INTO experiences (company, company_en, role, role_en, period, period_en, description, description_en, techs, type, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [company, company_en || '', role, role_en || '', period, period_en || '', description || '', description_en || '', techs || '', type || 'work', order_index ?? 0]
  )
  return result.insertId
}

async function update(id, data) {
  const { company, company_en, role, role_en, period, period_en, description, description_en, techs, type, order_index } = data
  await pool.query(
    'UPDATE experiences SET company = ?, company_en = ?, role = ?, role_en = ?, period = ?, period_en = ?, description = ?, description_en = ?, techs = ?, type = ?, order_index = ? WHERE id = ?',
    [company, company_en || '', role, role_en || '', period, period_en || '', description || '', description_en || '', techs || '', type || 'work', order_index ?? 0, id]
  )
}

async function remove(id) {
  await pool.query('DELETE FROM experiences WHERE id = ?', [id])
}

module.exports = { getAll, create, update, remove }
