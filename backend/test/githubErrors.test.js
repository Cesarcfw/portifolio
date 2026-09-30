const test = require('node:test')
const assert = require('node:assert/strict')
const { getRepos } = require('../src/controllers/githubController')

test('token rejeitado pelo GitHub gera código e log sem expor o token', async () => {
  const previousFetch = global.fetch
  const previousUsername = process.env.GITHUB_USERNAME
  const previousToken = process.env.GITHUB_TOKEN
  const previousConsoleError = console.error
  const logs = []

  try {
    process.env.GITHUB_USERNAME = 'example-user'
    process.env.GITHUB_TOKEN = 'test-secret-token'
    global.fetch = async () => ({
      ok: false,
      status: 401,
      headers: { get: () => null }
    })
    console.error = entry => logs.push(entry)

    const req = { method: 'GET', baseUrl: '/api/github', route: { path: '/repos' } }
    const res = {
      status(status) { this.statusCode = status; return this },
      json(body) { this.body = body; return this }
    }
    await getRepos(req, res)

    assert.equal(res.statusCode, 502)
    assert.equal(res.body.code, 'GITHUB_AUTH_FAILED')
    assert.equal(JSON.parse(logs[0]).upstreamStatus, 401)
    assert.equal(logs.join('').includes('test-secret-token'), false)
  } finally {
    global.fetch = previousFetch
    console.error = previousConsoleError
    if (previousUsername === undefined) delete process.env.GITHUB_USERNAME
    else process.env.GITHUB_USERNAME = previousUsername
    if (previousToken === undefined) delete process.env.GITHUB_TOKEN
    else process.env.GITHUB_TOKEN = previousToken
  }
})
