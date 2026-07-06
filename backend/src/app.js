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

      // Seeding das tabelas se vazias
      const [skillsCount] = await pool.query('SELECT COUNT(*) as count FROM skills')
      if (skillsCount[0].count === 0) {
        console.log('Seeding default skills...')
        const defaultSkillsSeed = [
          { name: 'React', category: 'Frontend', level: 90, color: '#61dafb' },
          { name: 'Vue.js', category: 'Frontend', level: 85, color: '#4fc08d' },
          { name: 'TypeScript', category: 'Frontend', level: 85, color: '#3178c6' },
          { name: 'HTML', category: 'Frontend', level: 95, color: '#e34c26' },
          { name: 'CSS', category: 'Frontend', level: 90, color: '#264de4' },
          { name: 'Tailwind', category: 'Frontend', level: 90, color: '#38bdf8' },
          { name: 'Node.js', category: 'Backend', level: 85, color: '#339933' },
          { name: 'Express', category: 'Backend', level: 85, color: '#828282' },
          { name: 'Python', category: 'Backend', level: 80, color: '#3776ab' },
          { name: 'Java', category: 'Backend', level: 70, color: '#007396' },
          { name: 'MySQL', category: 'Banco de dados', level: 85, color: '#00758f' },
          { name: 'SQL', category: 'Banco de dados', level: 85, color: '#f29111' },
          { name: 'Git', category: 'Ferramentas', level: 85, color: '#f05032' },
          { name: 'Node-RED', category: 'Ferramentas', level: 90, color: '#8f0000' },
          { name: 'Make', category: 'Ferramentas', level: 80, color: '#6c63ff' },
          { name: 'Docker', category: 'Ferramentas', level: 75, color: '#2496ed' },
          { name: 'WordPress', category: 'Ferramentas', level: 85, color: '#21759b' },
          { name: 'Ubuntu Server', category: 'Infraestrutura', level: 80, color: '#e95420' },
          { name: 'Apache', category: 'Infraestrutura', level: 75, color: '#d22128' },
          { name: 'PM2', category: 'Infraestrutura', level: 80, color: '#2b037a' },
          { name: 'Cloudflare', category: 'Infraestrutura', level: 80, color: '#f38020' }
        ]
        for (const skill of defaultSkillsSeed) {
          await pool.query(
            'INSERT INTO skills (name, category, level, color) VALUES (?, ?, ?, ?)',
            [skill.name, skill.category, skill.level, skill.color]
          )
        }
        console.log('Skills semeadas com sucesso!')
      }

      const [experiencesCount] = await pool.query('SELECT COUNT(*) as count FROM experiences')
      if (experiencesCount[0].count === 0) {
        console.log('Seeding default experiences...')
        const defaultExpSeed = [
          {
            company: 'MTEC Energia',
            role: 'Jovem Aprendiz',
            period: '2024 - 2025',
            description: 'Desenvolvimento de sistemas Full Stack, análise de dados, construção e manutenção de site.',
            techs: 'Node-RED, Vue.js, Node.js, MySQL, Wordpress, JavaScript, Elementor, Ubuntu Server, Cloudflare SSL, Apache, PM2',
            type: 'work',
            order_index: 0
          },
          {
            company: 'MTEC Energia',
            role: 'Estagiário de TI',
            period: '2025 - Atualmente',
            description: 'Desenvolvimento de sistemas Full Stack, automações, análise de dados, suporte de TI, construção e manutenção de site.',
            techs: 'Node-RED, Vue.js, Node.js, MySQL, Make, Wordpress, JavaScript, Elementor, Ubuntu Server, Bitrix24 CRM, Apache, PM2',
            type: 'work',
            order_index: 1
          },
          {
            company: 'Centro de Ensino Universitário do Distrito Federal (UDF)',
            role: 'Ciência da Computação',
            period: 'Conclusão prevista: 12/2026',
            description: '',
            techs: '',
            type: 'education',
            order_index: 0
          }
        ]
        for (const exp of defaultExpSeed) {
          await pool.query(
            'INSERT INTO experiences (company, role, period, description, techs, type, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [exp.company, exp.role, exp.period, exp.description, exp.techs, exp.type, exp.order_index]
          )
        }
        console.log('Experiências semeadas com sucesso!')
      }
    } catch (dbError) {
      console.error('Falha ao conectar na Aiven no boot:', dbError.message)
      dbMonitor.notifyFailure(dbError)
    }
  }
})