const { Resend } = require('resend')

async function sendMessage(req, res) {
  const { name, email, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Preencha todos os campos' })
  }

  try {
    const targetEmail = process.env.MY_EMAIL || process.env.EMAIL_USER
    if (!process.env.RESEND_API_KEY || !targetEmail) {
      return res.status(500).json({ error: 'Serviço de e-mail não configurado no servidor' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetEmail,
      subject: `Nova mensagem de ${name}`,
      html: `
        <h3>Nova mensagem pelo portfólio</h3>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>E-mail (Para você responder):</strong> ${email}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${message}</p>
      `
    })

    if (error) {
      console.error('Resend API Error:', error)
      return res.status(500).json({ error: 'Erro ao enviar mensagem pela API' })
    }

    res.json({ message: 'Mensagem enviada!' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' })
  }
}

module.exports = { sendMessage }