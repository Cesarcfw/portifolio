/**
 * Arquivo principal de entrada (entry point) do Backend.
 * Configura o servidor Express, WebSockets (Socket.IO), Middlewares e Rotas.
 */
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { Resend } = require('resend')
require('dotenv').config()

const pool = require('./database/connection')
const dbMonitor = require('./services/dbMonitor')

const authRoutes = require('./routes/authRoutes')
const projectRoutes = require('./routes/projectRoutes')
const githubRoutes = require('./routes/githubRoutes')
const contactRoutes = require('./routes/contactRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const skillsRoutes = require('./routes/skillsRoutes')
const experienceRoutes = require('./routes/experienceRoutes')

const app = express()
app.set('trust proxy', 1)
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
})

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use((req, res, next) => {
  req.io = io
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/github', githubRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/skills', skillsRoutes)
app.use('/api/experiences', experienceRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'API do portfólio funcionando!' })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`)

  const targetEmail = process.env.MY_EMAIL || process.env.EMAIL_USER
  if (process.env.RESEND_API_KEY && targetEmail) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    // 1. Avisa que o Render ligou
    resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetEmail,
      subject: `☕ Servidor do Portfólio Acordou!`,
      html: `
        <h3>Servidor Online!</h3>
        <p>O seu servidor no Render acabou de inicializar (acordou da hibernação ou foi reiniciado).</p>
        <p><strong>Horário:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
      `
    }).catch(err => console.error('Erro ao enviar alerta de boot:', err))

    // 2. Testa a Aiven e roda auto-migrações
    try {
      await pool.query('SELECT 1')
      console.log('Conexão com a Aiven testada com sucesso no boot.')
      dbMonitor.notifyRecovery()

      // Auto-migração das tabelas adicionais
      await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          setting_key   VARCHAR(100) PRIMARY KEY,
          setting_value TEXT
        )
      `)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS skills (
          id          INT AUTO_INCREMENT PRIMARY KEY,
          name        VARCHAR(50) NOT NULL,
          category    VARCHAR(50) NOT NULL,
          level       INT DEFAULT 80,
          color       VARCHAR(20) DEFAULT '#00f0ff',
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS experiences (
          id          INT AUTO_INCREMENT PRIMARY KEY,
          company     VARCHAR(100) NOT NULL,
          role        VARCHAR(100) NOT NULL,
          period      VARCHAR(50) NOT NULL,
          description TEXT,
          techs       VARCHAR(255) DEFAULT '',
          type        VARCHAR(20) DEFAULT 'work',
          order_index INT DEFAULT 0,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('Auto-migrações concluídas no boot.')
    } catch (dbError) {
      console.error('Falha ao conectar na Aiven no boot:', dbError.message)
      dbMonitor.notifyFailure(dbError)
    }
  }
})