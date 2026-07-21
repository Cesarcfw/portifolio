const mysql = require('mysql2/promise')
require('dotenv').config()
const { createDatabaseSslConfig } = require('./sslConfig')

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: createDatabaseSslConfig({
    host: process.env.DB_HOST,
    caBase64: process.env.DB_SSL_CA_BASE64,
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED
  })
})

module.exports = pool
