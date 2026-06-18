const express = require('express')
const router = express.Router()
const { getRepos, getContributions, getLanguages } = require('../controllers/githubController')

router.get('/repos', getRepos)
router.get('/contributions', getContributions)
router.get('/languages', getLanguages)

module.exports = router