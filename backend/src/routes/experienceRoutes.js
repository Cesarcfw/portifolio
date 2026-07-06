const express = require('express')
const router = express.Router()
const { getExperiences, createExperience, updateExperience, removeExperience } = require('../controllers/experienceController')
const { protect } = require('../middleware/authMiddleware')

router.get('/', getExperiences)
router.post('/', protect, createExperience)
router.put('/:id', protect, updateExperience)
router.delete('/:id', protect, removeExperience)

module.exports = router
