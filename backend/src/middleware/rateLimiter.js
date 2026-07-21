const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 300,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 10, // limite de 10 tentativas por IP
  message: { error: 'Muitas tentativas de login a partir deste IP. Tente novamente em 15 minutos.' },
  standardHeaders: true, // Retorna info de limite nos headers RateLimit-*
  legacyHeaders: false, // Desabilita os headers X-RateLimit-*
})

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 5, // limite de 5 mensagens de contato por IP
  message: { error: 'Muitas mensagens enviadas a partir deste IP. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const githubLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 120,
  message: { error: 'Muitas consultas ao GitHub. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = {
  apiLimiter,
  loginLimiter,
  contactLimiter,
  githubLimiter
}
