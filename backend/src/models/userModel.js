const pool = require('../database/connection')

async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?', [email]
  )
  return rows[0]
}

async function create(email, passwordHash) {
  const [result] = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    [email, passwordHash]
  )
  return result.insertId
}

async function updatePassword(email, passwordHash) {
  await pool.query(
    'UPDATE users SET password_hash = ? WHERE email = ?',
    [passwordHash, email]
  )
}

module.exports = { findByEmail, create, updatePassword }