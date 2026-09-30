const jwt = require('jsonwebtoken')
const { respondError } = require('../utils/apiErrors')

function protect(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) return respondError(req, res, 'AUTH_TOKEN_INVALID', { message: 'Não autorizado' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    req.user = decoded
    next()
  } catch (err) {
    respondError(req, res, err.name === 'TokenExpiredError' ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID')
  }
}

module.exports = { protect }
