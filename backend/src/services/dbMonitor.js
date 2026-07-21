const { Resend } = require('resend')
const { escapeHtml } = require('../utils/security')

// Variável de memória para evitar SPAM de e-mails
let isDatabaseOffline = false

async function notifyFailure(dbError) {
  // Se já sabemos que está offline, não enviamos outro e-mail
  if (isDatabaseOffline) return

  isDatabaseOffline = true // Marcamos que caiu
  console.log('DB Monitor: Banco offline detectado. Enviando alerta...')

  const targetEmail = process.env.MY_EMAIL || process.env.EMAIL_USER
  if (!process.env.RESEND_API_KEY || !targetEmail) return

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetEmail,
      subject: 'Falha de conexão com o banco de dados',
      html: `
        <h2 style="color: #d9534f;">Falha de conexão com o banco de dados</h2>
        <p>Uma consulta do portfólio não conseguiu acessar o serviço MySQL.</p>
        <p>Verifique o estado da instância, as credenciais, a rede e o certificado TLS no provedor.</p>
        <p style="color: gray; font-size: 12px;"><strong>Erro técnico:</strong> ${escapeHtml(dbError.message || dbError)}</p>
        <hr />
        <p><small>Este alerta foi acionado pelo acesso de um visitante.</small></p>
      `
    })
    console.log('DB Monitor: Alerta de falha enviado com sucesso.')
  } catch (err) {
    console.error('DB Monitor: Erro ao enviar alerta da Aiven:', err)
  }
}

async function notifyRecovery() {
  // Se não sabíamos que estava offline, não fazemos nada
  if (!isDatabaseOffline) return

  isDatabaseOffline = false // Marcamos que voltou
  console.log('DB Monitor: Banco online detectado. Enviando aviso de recuperação...')

  const targetEmail = process.env.MY_EMAIL || process.env.EMAIL_USER
  if (!process.env.RESEND_API_KEY || !targetEmail) return

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetEmail,
      subject: 'Conexão com o banco de dados restabelecida',
      html: `
        <h2 style="color: #5cb85c;">Conexão restabelecida</h2>
        <p>Uma consulta ao banco de dados foi concluída com sucesso após a falha anterior.</p>
      `
    })
    console.log('DB Monitor: Aviso de recuperação enviado com sucesso.')
  } catch (err) {
    console.error('DB Monitor: Erro ao enviar aviso de recuperação:', err)
  }
}

module.exports = {
  notifyFailure,
  notifyRecovery
}
