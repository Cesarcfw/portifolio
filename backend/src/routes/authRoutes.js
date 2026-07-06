const express = require('express')
const router = express.Router()
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController')
const { loginLimiter } = require('../middleware/rateLimiter')

router.post('/register', register)
router.post('/login', loginLimiter, login)
router.post('/forgot-password', loginLimiter, forgotPassword)
router.post('/reset-password', loginLimiter, resetPassword)

module.exports = router