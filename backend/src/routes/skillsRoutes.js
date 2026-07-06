const express = require('express')
const router = express.Router()
const { getSkills, createSkill, updateSkill, removeSkill } = require('../controllers/skillsController')
const { protect } = require('../middleware/authMiddleware')

router.get('/', getSkills)
router.post('/', protect, createSkill)
router.put('/:id', protect, updateSkill)
router.delete('/:id', protect, removeSkill)

module.exports = router
