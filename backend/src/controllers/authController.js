const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { Resend } = require('resend')
const userModel = require('../models/userModel')
const { normalizeEmail, isValidEmail, isValidPassword, escapeHtml, normalizeHttpOrigin } = require('../utils/security')

const RESET_RESPONSE = { message: 'Se o e-mail estiver cadastrado, as instruções de recuperação serão enviadas.' }
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-comparison-placeholder', 10)

function passwordVersion(passwordHash) {
  return crypto.createHash('sha256').update(passwordHash).digest('hex')
}

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || !left || !right) return false
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

/**
 * Registra um novo administrador no sistema.
 */
async function register(req, res) {
  const email = normalizeEmail(req.body.email)
  const { password, setupKey } = req.body
  try {
    if (!safeEqual(setupKey, process.env.ADMIN_SETUP_KEY)) {
      return res.status(403).json({ error: 'Chave de configuração inicial inválida.' })
    }

    if (!isValidEmail(email) || !isValidPassword(password)) {
      return res.status(400).json({ error: 'Informe um e-mail válido e uma senha entre 12 e 128 caracteres.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await userModel.createFirstAdmin(email, passwordHash)
    if (!result.created) {
      return res.status(403).json({ error: 'O registro de novos administradores está desativado.' })
    }
    res.status(201).json({ id: result.id, email })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar usuário' })
  }
}

/**
 * Autentica o usuário e retorna um token JWT caso as credenciais estejam corretas.
 */
async function login(req, res) {
  const email = normalizeEmail(req.body.email)
  const { password } = req.body
  if (!isValidEmail(email) || typeof password !== 'string' || password.length > 128) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }
  try {
    const user = await userModel.findByEmail(email)
    const valid = await bcrypt.compare(password, user?.password_hash || DUMMY_PASSWORD_HASH)
    if (!user || !valid) return res.status(401).json({ error: 'Credenciais inválidas' })

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
  const email = normalizeEmail(req.body.email)
  if (!isValidEmail(email)) return res.json(RESET_RESPONSE)

  try {
    const user = await userModel.findByEmail(email)
    if (!user) return res.json(RESET_RESPONSE)

    const token = jwt.sign(
      { email: user.email, purpose: 'reset', passwordVersion: passwordVersion(user.password_hash) },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    const targetEmail = process.env.MY_EMAIL || process.env.EMAIL_USER
    if (!process.env.RESEND_API_KEY || !targetEmail) {
      console.error('Recuperação de senha indisponível: serviço de e-mail não configurado')
      return res.json(RESET_RESPONSE)
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const frontendUrl = normalizeHttpOrigin((process.env.FRONTEND_URL || '').split(',')[0]) ||
      (process.env.NODE_ENV === 'production' ? 'https://portifolio-kohl-mu.vercel.app' : 'http://localhost:5173')
    const resetLink = `${frontendUrl}/admin/reset?token=${token}`

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetEmail, // Força enviar para o e-mail do dono da conta, evitando bloqueio do Resend free
      subject: 'Recuperação de Senha',
      html: `
        <h3>Recuperação de Senha</h3>
        <p>Você solicitou a redefinição de sua senha do painel administrador para o usuário: ${escapeHtml(user.email)}</p>
        <p>Clique no link abaixo para criar uma nova senha (válido por 15 minutos):</p>
        <a href="${escapeHtml(resetLink)}">${escapeHtml(resetLink)}</a>
      `
    })

    if (error) {
      console.error('Erro Resend:', error)
      return res.json(RESET_RESPONSE)
    }

    res.json(RESET_RESPONSE)
  } catch (err) {
    console.error('Erro ao processar recuperação de senha:', err)
    res.json(RESET_RESPONSE)
  }
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.body
  if (typeof token !== 'string' || !isValidPassword(newPassword)) {
    return res.status(400).json({ error: 'Token inválido ou senha fora do padrão de 12 a 128 caracteres.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ error: 'Token inválido para esta operação' })
    }

    const user = await userModel.findByEmail(decoded.email)
    if (!user || !safeEqual(decoded.passwordVersion, passwordVersion(user.password_hash))) {
      return res.status(400).json({ error: 'Token inválido ou já utilizado' })
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
