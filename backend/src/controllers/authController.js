const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
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

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const resetLink = `http://localhost:5173/admin/reset?token=${token}`

    await transporter.sendMail({
      from: `"Portfólio Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperação de Senha',
      html: `
        <h3>Recuperação de Senha</h3>
        <p>Você solicitou a redefinição de sua senha.</p>
        <p>Clique no link abaixo para criar uma nova senha (válido por 15 minutos):</p>
        <a href="${resetLink}">${resetLink}</a>
      `
    })

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