const { Resend } = require('resend')
const { normalizeEmail, isValidEmail, escapeHtml } = require('../utils/security')

async function sendMessage(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const email = normalizeEmail(req.body.email)
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : ''

  if (!name || name.length > 100 || !isValidEmail(email) || !message || message.length > 5000) {
    return res.status(400).json({ error: 'Preencha os campos com dados válidos' })
  }

  try {
    const targetEmail = process.env.MY_EMAIL || process.env.EMAIL_USER
    if (!process.env.RESEND_API_KEY || !targetEmail) {
      return res.status(500).json({ error: 'Serviço de e-mail não configurado no servidor' })
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
      console.error('Resend API Error:', error)
      return res.status(500).json({ error: 'Erro ao enviar mensagem pela API' })
    }

    res.json({ message: 'Mensagem enviada!' })
  } catch (err) {
    console.error('Erro inesperado no envio pelo Resend:', err)
    res.status(500).json({ error: 'Erro ao enviar mensagem' })
  }
}

module.exports = { sendMessage }
