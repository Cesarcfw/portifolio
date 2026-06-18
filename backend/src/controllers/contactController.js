const nodemailer = require('nodemailer')

async function sendMessage(req, res) {
  const { name, email, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Preencha todos os campos' })
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    await transporter.sendMail({
      from: `"Portfólio" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `Nova mensagem de ${name}`,
      html: `
        <h3>Nova mensagem pelo portfólio</h3>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${message}</p>
      `
    })

    res.json({ message: 'Mensagem enviada!' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' })
  }
}

module.exports = { sendMessage }