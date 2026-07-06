const express = require('express')
const router = express.Router()
const { sendMessage } = require('../controllers/contactController')
const { contactLimiter } = require('../middleware/rateLimiter')

router.post('/', contactLimiter, sendMessage)

module.exports = router