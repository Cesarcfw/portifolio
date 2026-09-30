const { Resend } = require('resend')
const { normalizeEmail, isValidEmail, escapeHtml } = require('../utils/security')
const { respondError } = require('../utils/apiErrors')

async function sendMessage(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const email = normalizeEmail(req.body.email)
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : ''

  if (!name || name.length > 100 || !isValidEmail(email) || !message || message.length > 5000) {
    return respondError(req, res, 'INVALID_INPUT', { message: 'Preencha os campos com dados válidos' })
  }

  try {
    const targetEmail = process.env.MY_EMAIL || process.env.EMAIL_USER
    if (!process.env.RESEND_API_KEY || !targetEmail) {
      return respondError(req, res, 'EMAIL_NOT_CONFIGURED', { message: 'Serviço de e-mail não configurado no servidor' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetEmail,
      subject: `Nova mensagem pelo portfólio`,
      html: `
        <h3>Nova mensagem pelo portfólio</h3>
        <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p><strong>E-mail (para resposta):</strong> ${escapeHtml(email)}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${escapeHtml(message).replaceAll('\n', '<br>')}</p>
      `
    })

    if (error) {
      return respondError(req, res, 'EMAIL_DELIVERY_FAILED', { cause: error, message: 'Erro ao enviar mensagem pela API' })
    }

    res.json({ message: 'Mensagem enviada!' })
  } catch (err) {
    respondError(req, res, 'EMAIL_DELIVERY_FAILED', { cause: err })
  }
}

module.exports = { sendMessage }
