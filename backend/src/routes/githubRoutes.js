const express = require('express')
const router = express.Router()
const { getRepos, getContributions, getLanguages, getPortfolioVersion } = require('../controllers/githubController')

router.get('/repos', getRepos)
router.get('/contributions', getContributions)
router.get('/languages', getLanguages)
router.get('/version', getPortfolioVersion)

module.exports = router