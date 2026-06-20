/**
 * Arquivo principal de entrada (entry point) do Backend.
 * Configura o servidor Express, WebSockets (Socket.IO), Middlewares e Rotas.
 */
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const nodemailer = require('nodemailer')
require('dotenv').config()

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
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)

  // Notificação de Boot
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    transporter.sendMail({
      from: `"Alerta Portfólio" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `☕ Servidor do Portfólio Acordou!`,
      html: `
        <h3>Servidor Online!</h3>
        <p>O seu servidor no Render acabou de inicializar (acordou da hibernação ou foi reiniciado).</p>
        <p><strong>Horário:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
      `
    }).catch(err => console.error('Erro ao enviar alerta de boot:', err))
  }
})