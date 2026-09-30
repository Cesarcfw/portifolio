const ERRORS = Object.freeze({
  INVALID_INPUT: { status: 400, message: 'Dados inválidos ou incompletos' },
  INVALID_JSON: { status: 400, message: 'JSON inválido' },
  PAYLOAD_TOO_LARGE: { status: 413, message: 'Corpo da requisição excede o limite permitido' },
  NOT_FOUND: { status: 404, message: 'Recurso não encontrado' },
  RATE_LIMITED: { status: 429, message: 'Muitas requisições. Tente novamente em alguns minutos.' },
  AUTH_INVALID_CREDENTIALS: { status: 401, message: 'Credenciais inválidas' },
  AUTH_TOKEN_INVALID: { status: 401, message: 'Token inválido' },
  AUTH_TOKEN_EXPIRED: { status: 401, message: 'Token expirado' },
  ADMIN_SETUP_DENIED: { status: 403, message: 'Configuração inicial não autorizada' },
  PASSWORD_RESET_INVALID: { status: 400, message: 'Link de recuperação inválido ou já utilizado' },
  DATABASE_UNAVAILABLE: { status: 503, message: 'Banco de dados temporariamente indisponível' },
  DATABASE_QUERY_FAILED: { status: 500, message: 'Erro ao consultar o banco de dados' },
  GITHUB_NOT_CONFIGURED: { status: 503, message: 'Integração com GitHub não configurada' },
  GITHUB_AUTH_FAILED: { status: 502, message: 'Integração com GitHub indisponível' },
  GITHUB_FORBIDDEN: { status: 502, message: 'Acesso à integração com GitHub negado' },
  GITHUB_BRANCH_PROTECTED: { status: 409, message: 'A branch main exige alterações por Pull Request' },
  GITHUB_FILE_CONFLICT: { status: 409, message: 'O arquivo mudou no GitHub. Atualize a página e tente novamente' },
  GITHUB_RATE_LIMITED: { status: 503, message: 'Limite de consultas ao GitHub atingido' },
  GITHUB_TIMEOUT: { status: 504, message: 'A consulta ao GitHub demorou mais que o esperado' },
  GITHUB_UPSTREAM_ERROR: { status: 502, message: 'Erro ao consultar o GitHub' },
  RESUME_INVALID_PDF: { status: 400, message: 'O arquivo deve ser um PDF válido com no máximo 5 MB' },
  RESUME_NOT_FOUND: { status: 404, message: 'Currículo não encontrado' },
  RESUME_FILE_NOT_FOUND: { status: 404, message: 'Arquivo do currículo não encontrado no GitHub' },
  RESUME_PAIR_INVALID: { status: 400, message: 'Par de currículos inválido' },
  RESUME_PAIR_CONFLICT: { status: 409, message: 'Currículo já pertence a um par completo' },
  RESUME_UPLOAD_FAILED: { status: 502, message: 'Erro ao enviar currículo ao GitHub' },
  EMAIL_NOT_CONFIGURED: { status: 503, message: 'Serviço de e-mail indisponível' },
  EMAIL_DELIVERY_FAILED: { status: 502, message: 'Erro ao enviar mensagem' },
  INTERNAL_ERROR: { status: 500, message: 'Erro interno do servidor' }
})

function respondError(req, res, code, options = {}) {
  const definition = ERRORS[code] || ERRORS.INTERNAL_ERROR
  const status = options.status || definition.status
  if (status >= 500 || options.log) {
    // Somente campos controlados: nunca registrar tokens, corpo da requisição ou URL completa.
    console.error(JSON.stringify({
      event: 'api_error',
      code,
      status,
      method: req.method,
      route: `${req.baseUrl || ''}${req.route?.path || ''}`,
      upstreamStatus: options.upstreamStatus || undefined,
      causeName: options.cause?.name || 'None',
      causeCode: /^[A-Z0-9_]+$/.test(options.cause?.code || '') ? options.cause.code : undefined
    }))
  }
  return res.status(status).json({ code, error: options.message || definition.message })
}

function classifyGithubError(error) {
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return 'GITHUB_TIMEOUT'
  if (error?.upstreamStatus === 401) return 'GITHUB_AUTH_FAILED'
  if (error?.upstreamStatus === 429 || error?.rateLimited) return 'GITHUB_RATE_LIMITED'
  if (error?.upstreamStatus === 403) return 'GITHUB_FORBIDDEN'
  return 'GITHUB_UPSTREAM_ERROR'
}

function classifyDatabaseError(error) {
  const unavailable = new Set([
    'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND',
    'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR'
  ])
  return unavailable.has(error?.code) ? 'DATABASE_UNAVAILABLE' : 'DATABASE_QUERY_FAILED'
}

function respondDatabaseError(req, res, error) {
  return respondError(req, res, classifyDatabaseError(error), { cause: error })
}

module.exports = { ERRORS, respondError, respondDatabaseError, classifyGithubError, classifyDatabaseError }
