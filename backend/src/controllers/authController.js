const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { Resend } = require('resend')
const userModel = require('../models/userModel')

/**
 * Registra um novo administrador no sistema.
 */
async function register(req, res) {
  const { email, password } = req.body
  try {
    const existing = await userModel.findByEmail(email)
    if (existing) return res.status(400).json({ error: 'Email já cadastrado' })

    const passwordHash = await bcrypt.hash(password, 10)
    const id = await userModel.create(email, passwordHash)
    res.status(201).json({ id, email })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar usuário' })
  }
}

/**
 * Autentica o usuário e retorna um token JWT caso as credenciais estejam corretas.
 */
async function login(req, res) {
  const { email, password } = req.body
  try {
    const user = await userModel.findByEmail(email)
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' })

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({ token })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer login' })
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body
  try {
    const user = await userModel.findByEmail(email)
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })

    const token = jwt.sign(
      { email: user.email, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    const targetEmail = process.env.MY_EMAIL || process.env.EMAIL_USER
    if (!process.env.RESEND_API_KEY || !targetEmail) {
      return res.status(500).json({ error: 'Serviço de e-mail não configurado' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const frontendUrl = req.headers.origin || 'http://localhost:5173'
    const resetLink = `${frontendUrl}/admin/reset?token=${token}`

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetEmail, // Força enviar para o e-mail do dono da conta, evitando bloqueio do Resend free
      subject: 'Recuperação de Senha',
      html: \`
        <h3>Recuperação de Senha</h3>
        <p>Você solicitou a redefinição de sua senha do painel administrador para o usuário: \${user.email}</p>
        <p>Clique no link abaixo para criar uma nova senha (válido por 15 minutos):</p>
        <a href="\${resetLink}">\${resetLink}</a>
      \`
    })

    if (error) {
      console.error('Erro Resend:', error)
      return res.status(500).json({ error: 'Falha do provedor ao enviar e-mail' })
    }

    res.json({ message: 'E-mail de recuperação enviado!' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar e-mail de recuperação' })
  }
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.body
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ error: 'Token inválido para esta operação' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await userModel.updatePassword(decoded.email, passwordHash)

    res.json({ message: 'Senha atualizada com sucesso!' })
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Token expirado' })
    }
    res.status(400).json({ error: 'Token inválido ou erro ao redefinir senha' })
  }
}

module.exports = { register, login, forgotPassword, resetPassword }