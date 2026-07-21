const mysql = require('mysql2/promise')
require('dotenv').config()

const isLocalDatabase = ['localhost', '127.0.0.1'].includes(process.env.DB_HOST)
const databaseCa = process.env.DB_SSL_CA_BASE64
  ? Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64').toString('utf8')
  : undefined

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: isLocalDatabase ? undefined : {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ...(databaseCa ? { ca: databaseCa } : {})
  }
})

module.exports = pool
