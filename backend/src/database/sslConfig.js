function createDatabaseSslConfig({ host, caBase64, rejectUnauthorized }) {
  const normalizedHost = typeof host === 'string' ? host.trim().toLowerCase() : ''
  if (['localhost', '127.0.0.1'].includes(normalizedHost)) return undefined

  const ca = typeof caBase64 === 'string' && caBase64.trim()
    ? Buffer.from(caBase64.trim(), 'base64').toString('utf8')
    : undefined

  return {
    // Aiven usa uma CA privada. Sem ela, mantém TLS para compatibilidade;
    // quando a CA é fornecida, valida o certificado por padrão.
    rejectUnauthorized: Boolean(ca) && rejectUnauthorized !== 'false',
    ...(ca ? { ca } : {})
  }
}

module.exports = { createDatabaseSslConfig }
