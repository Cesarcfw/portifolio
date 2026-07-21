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

async function ensureColumn(table, column, definition) {
  const [rows] = await pool.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column])
  if (rows.length === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`)
  }
}

const authRoutes = require('./routes/authRoutes')
const projectRoutes = require('./routes/projectRoutes')
const githubRoutes = require('./routes/githubRoutes')
const contactRoutes = require('./routes/contactRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const skillsRoutes = require('./routes/skillsRoutes')
const experienceRoutes = require('./routes/experienceRoutes')
const { apiLimiter } = require('./middleware/rateLimiter')
const { normalizeHttpOrigin } = require('./utils/security')

const app = express()
app.set('trust proxy', 1)

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET deve estar configurado com pelo menos 32 caracteres')
}

const configuredOrigins = (process.env.FRONTEND_URL || '').split(',').map(origin => origin.trim()).filter(Boolean)
const invalidOrigin = configuredOrigins.find(origin => !normalizeHttpOrigin(origin))
if (invalidOrigin) {
  throw new Error('FRONTEND_URL deve conter somente origens HTTP/HTTPS válidas, separadas por vírgula')
}

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://portifolio-kohl-mu.vercel.app',
  ...configuredOrigins.map(normalizeHttpOrigin)
])
const corsOptions = {
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

const server = http.createServer(app)
const io = new Server(server, {
  cors: corsOptions
})

app.disable('x-powered-by')
app.use(cors(corsOptions))
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})
app.use(express.json({ limit: '15mb', type: 'application/json' }))

app.use((req, res, next) => {
  req.io = io
  next()
})

app.use('/api', apiLimiter)
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

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' })
})

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Corpo da requisição excede o limite permitido' })
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido' })
  }
  console.error('Erro não tratado na API:', err)
  res.status(500).json({ error: 'Erro interno do servidor' })
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
      subject: 'Servidor do portfólio iniciado',
      html: `
        <h3>Servidor Online!</h3>
        <p>A instância do backend foi inicializada ou reiniciada.</p>
        <p><strong>Horário:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
      `
    }).catch(err => console.error('Erro ao enviar alerta de boot:', err))
  }

  // Testa o banco e garante o schema independentemente da configuração de e-mail.
  try {
      await pool.query('SELECT 1')
      console.log('Conexão com o banco testada com sucesso no boot.')
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
          name_en     VARCHAR(50) DEFAULT '',
          category    VARCHAR(50) NOT NULL,
          category_en VARCHAR(50) DEFAULT '',
          level       INT DEFAULT 80,
          color       VARCHAR(20) DEFAULT '#00f0ff',
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS experiences (
          id          INT AUTO_INCREMENT PRIMARY KEY,
          company     VARCHAR(100) NOT NULL,
          company_en  VARCHAR(100) DEFAULT '',
          role        VARCHAR(100) NOT NULL,
          role_en     VARCHAR(100) DEFAULT '',
          period      VARCHAR(50) NOT NULL,
          period_en   VARCHAR(50) DEFAULT '',
          description TEXT,
          description_en TEXT,
          techs       VARCHAR(255) DEFAULT '',
          type        VARCHAR(20) DEFAULT 'work',
          order_index INT DEFAULT 0,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      await ensureColumn('projects', 'title_en', "VARCHAR(100) DEFAULT ''")
      await ensureColumn('projects', 'description_en', 'TEXT')
      await ensureColumn('skills', 'name_en', "VARCHAR(50) DEFAULT ''")
      await ensureColumn('skills', 'category_en', "VARCHAR(50) DEFAULT ''")
      await ensureColumn('experiences', 'company_en', "VARCHAR(100) DEFAULT ''")
      await ensureColumn('experiences', 'role_en', "VARCHAR(100) DEFAULT ''")
      await ensureColumn('experiences', 'period_en', "VARCHAR(50) DEFAULT ''")
      await ensureColumn('experiences', 'description_en', 'TEXT')
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
        const categoryTranslations = {
          Frontend: 'Frontend',
          Backend: 'Backend',
          'Banco de dados': 'Databases',
          Ferramentas: 'Tools',
          Infraestrutura: 'Infrastructure'
        }
        for (const skill of defaultSkillsSeed) {
          await pool.query(
            'INSERT INTO skills (name, name_en, category, category_en, level, color) VALUES (?, ?, ?, ?, ?, ?)',
            [skill.name, skill.name, skill.category, categoryTranslations[skill.category], skill.level, skill.color]
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
            company_en: 'MTEC Energia',
            role: 'Jovem Aprendiz',
            role_en: 'Apprentice',
            period: '2024 - 2025',
            period_en: '2024 - 2025',
            description: 'Desenvolvimento de sistemas Full Stack, análise de dados, construção e manutenção de site.',
            description_en: 'Full Stack systems development, data analysis, website development, and maintenance.',
            techs: 'Node-RED, Vue.js, Node.js, MySQL, Wordpress, JavaScript, Elementor, Ubuntu Server, Cloudflare SSL, Apache, PM2',
            type: 'work',
            order_index: 0
          },
          {
            company: 'MTEC Energia',
            company_en: 'MTEC Energia',
            role: 'Estagiário de TI',
            role_en: 'IT Intern',
            period: '2025 - Atualmente',
            period_en: '2025 - Present',
            description: 'Desenvolvimento de sistemas Full Stack, automações, análise de dados, suporte de TI, construção e manutenção de site.',
            description_en: 'Full Stack systems development, automation, data analysis, IT support, website development, and maintenance.',
            techs: 'Node-RED, Vue.js, Node.js, MySQL, Make, Wordpress, JavaScript, Elementor, Ubuntu Server, Bitrix24 CRM, Apache, PM2',
            type: 'work',
            order_index: 1
          },
          {
            company: 'Centro de Ensino Universitário do Distrito Federal (UDF)',
            company_en: 'University Education Center of the Federal District (UDF)',
            role: 'Ciência da Computação',
            role_en: 'Computer Science',
            period: 'Conclusão prevista: 12/2026',
            period_en: 'Expected graduation: December 2026',
            description: '',
            description_en: '',
            techs: '',
            type: 'education',
            order_index: 0
          }
        ]
        for (const exp of defaultExpSeed) {
          await pool.query(
            'INSERT INTO experiences (company, company_en, role, role_en, period, period_en, description, description_en, techs, type, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [exp.company, exp.company_en, exp.role, exp.role_en, exp.period, exp.period_en, exp.description, exp.description_en, exp.techs, exp.type, exp.order_index]
          )
        }
        console.log('Experiências semeadas com sucesso!')
      }
  } catch (dbError) {
    console.error('Falha ao conectar no banco no boot:', dbError.message)
    dbMonitor.notifyFailure(dbError)
  }
})
