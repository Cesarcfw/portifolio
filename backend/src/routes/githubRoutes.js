const express = require('express')
const router = express.Router()
const { getRepos, getContributions } = require('../controllers/githubController')

router.get('/repos', getRepos)
router.get('/contributions', getContributions)

module.exports = router