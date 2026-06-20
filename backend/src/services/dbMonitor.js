const { Resend } = require('resend')

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
      subject: `🚨 BANCO AIVEN OFFLINE! Ligue o Banco de Dados`,
      html: `
        <h2 style="color: #d9534f;">ALERTA CRÍTICO: BANCO DE DADOS DESLIGADO</h2>
        <p>Um visitante tentou acessar o portfólio, mas o <strong>banco de dados na Aiven está desligado</strong>.</p>
        <p>Isso geralmente acontece se a Aiven pausou o banco por inatividade ou manutenção.</p>
        <p><strong>Ação Imediata:</strong> Acesse o painel da Aiven e ligue o serviço MySQL (Power On).</p>
        <p style="color: gray; font-size: 12px;"><strong>Erro técnico:</strong> ${dbError.message || dbError}</p>
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
      subject: `✅ Banco Aiven Online!`,
      html: `
        <h2 style="color: #5cb85c;">BOAS NOTÍCIAS: BANCO DE DADOS FUNCIONANDO</h2>
        <p>Um visitante acessou o portfólio e a consulta ao banco de dados foi concluída com sucesso.</p>
        <p>O sistema foi totalmente restabelecido e está operando normalmente.</p>
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
