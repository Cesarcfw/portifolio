const express = require('express')
const router = express.Router()
const { getSettings, updateSettings, uploadResume, removeResume } = require('../controllers/settingsController')
const { protect } = require('../middleware/authMiddleware')

router.get('/', getSettings)
router.put('/', protect, updateSettings)
router.post('/resume', protect, uploadResume)
router.delete('/resume/:id', protect, removeResume)

module.exports = router
