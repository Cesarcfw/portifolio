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

const authRoutes = require('./routes/authRoutes')
const projectRoutes = require('./routes/projectRoutes')
const githubRoutes = require('./routes/githubRoutes')
const contactRoutes = require('./routes/contactRoutes')
const settingsRoutes = require('./routes/settingsRoutes')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
})

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  req.io = io
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/github', githubRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/settings', settingsRoutes)

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

    // 2. Testa a Aiven
    try {
      await pool.query('SELECT 1')
      console.log('Conexão com a Aiven testada com sucesso no boot.')
    } catch (dbError) {
      console.error('Falha ao conectar na Aiven no boot:', dbError.message)
      resend.emails.send({
        from: 'onboarding@resend.dev',
        to: targetEmail,
        subject: `🚨 BANCO AIVEN OFFLINE! Ligue o Banco de Dados`,
        html: `
          <h2 style="color: #d9534f;">ALERTA CRÍTICO: BANCO DE DADOS DESLIGADO</h2>
          <p>O servidor do Render iniciou com sucesso, mas <strong>não conseguiu acessar o banco de dados na Aiven</strong>.</p>
          <p>Isso geralmente acontece se a Aiven pausou o banco por inatividade ou manutenção.</p>
          <p><strong>Ação Imediata:</strong> Acesse o painel da Aiven e ligue o serviço MySQL (Power On).</p>
          <p style="color: gray; font-size: 12px;"><strong>Erro técnico:</strong> ${dbError.message}</p>
        `
      }).catch(err => console.error('Erro ao enviar alerta da Aiven:', err))
    }
  }
})