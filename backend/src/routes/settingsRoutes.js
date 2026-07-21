const express = require('express')
const router = express.Router()
const { getSettings, updateSettings, uploadResume, uploadResumeCounterpart, linkResumeCounterparts, reorderResumePairs, removeResumePair, removeResume, editResume } = require('../controllers/settingsController')
const { protect } = require('../middleware/authMiddleware')

router.get('/', getSettings)
router.put('/', protect, updateSettings)
router.post('/resume', protect, uploadResume)
router.post('/resume/:id/counterpart', protect, uploadResumeCounterpart)
router.post('/resume/link', protect, linkResumeCounterparts)
router.put('/resume/order', protect, reorderResumePairs)
router.delete('/resume/pair/:pairId', protect, removeResumePair)
router.delete('/resume/:id', protect, removeResume)
router.put('/resume/:id', protect, editResume)

module.exports = router
