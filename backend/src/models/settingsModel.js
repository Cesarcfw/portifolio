const pool = require('../database/connection')

async function getAllSettings() {
  const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings')
  const settings = {}
  rows.forEach(row => {
    settings[row.setting_key] = row.setting_value
  })
  return settings
}

async function updateSetting(key, value) {
  await pool.query(
    'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
    [key, value, value]
  )
}

module.exports = { getAllSettings, updateSetting }
