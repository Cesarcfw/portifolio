const express = require('express')
const router = express.Router()
const { sendMessage } = require('../controllers/contactController')

router.post('/', sendMessage)

module.exports = router