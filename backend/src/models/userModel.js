const pool = require('../database/connection')

async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?', [email]
  )
  return rows[0]
}

async function createFirstAdmin(email, passwordHash) {
  const connection = await pool.getConnection()
  const lockName = 'portfolio_first_admin_setup'
  let lockAcquired = false

  try {
    const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName])
    lockAcquired = Number(lockRows[0]?.acquired) === 1
    if (!lockAcquired) throw new Error('Não foi possível obter o bloqueio de criação do administrador')

    const [countRows] = await connection.query('SELECT COUNT(*) AS count FROM users')
    if (Number(countRows[0].count) > 0) return { created: false }

    const [result] = await connection.query(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    )
    return { created: true, id: result.insertId }
  } finally {
    if (lockAcquired) {
      await connection.query('SELECT RELEASE_LOCK(?)', [lockName]).catch(() => {})
    }
    connection.release()
  }
}

async function updatePassword(email, passwordHash) {
  await pool.query(
    'UPDATE users SET password_hash = ? WHERE email = ?',
    [passwordHash, email]
  )
}

module.exports = { findByEmail, createFirstAdmin, updatePassword }
