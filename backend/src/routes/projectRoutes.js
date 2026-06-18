const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  getAll, getFeatured, getById,
  create, update, remove
} = require('../controllers/projectController')

// Rotas públicas — qualquer um pode ver
router.get('/', getAll)
router.get('/featured', getFeatured)
router.get('/:id', getById)

// Rotas protegidas — só admin com token JWT
router.post('/', protect, create)
router.put('/:id', protect, update)
router.delete('/:id', protect, remove)

module.exports = router