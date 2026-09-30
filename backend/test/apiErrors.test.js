const test = require('node:test')
const assert = require('node:assert/strict')
const { ERRORS, respondError, classifyGithubError, classifyDatabaseError } = require('../src/utils/apiErrors')

test('diferencia token inválido, permissão negada e limite do GitHub', () => {
  assert.equal(classifyGithubError({ upstreamStatus: 401 }), 'GITHUB_AUTH_FAILED')
  assert.equal(classifyGithubError({ upstreamStatus: 403 }), 'GITHUB_FORBIDDEN')
  assert.equal(classifyGithubError({ upstreamStatus: 403, rateLimited: true }), 'GITHUB_RATE_LIMITED')
  assert.equal(classifyGithubError({ upstreamStatus: 429 }), 'GITHUB_RATE_LIMITED')
  assert.equal(ERRORS.GITHUB_AUTH_FAILED.status, 502)
})

test('diferencia timeout e falhas de banco', () => {
  assert.equal(classifyGithubError({ name: 'TimeoutError' }), 'GITHUB_TIMEOUT')
  assert.equal(classifyGithubError({ name: 'TypeError' }), 'GITHUB_UPSTREAM_ERROR')
  assert.equal(classifyDatabaseError({ code: 'ECONNREFUSED' }), 'DATABASE_UNAVAILABLE')
  assert.equal(classifyDatabaseError({ code: 'ER_BAD_FIELD_ERROR' }), 'DATABASE_QUERY_FAILED')
})

test('resposta e log não incluem credenciais nem corpo da requisição', () => {
  const entries = []
  const originalError = console.error
  console.error = entry => entries.push(entry)
  try {
    const req = {
      method: 'GET', baseUrl: '/api/github', route: { path: '/repos' },
      body: { token: 'secret-token' }
    }
    const res = {
      status(value) { this.statusCode = value; return this },
      json(value) { this.body = value; return this }
    }
    respondError(req, res, 'GITHUB_AUTH_FAILED', {
      cause: new Error('secret-token'), upstreamStatus: 401
    })
    assert.deepEqual(res.body, {
      code: 'GITHUB_AUTH_FAILED', error: 'Integração com GitHub indisponível'
    })
    assert.equal(res.statusCode, 502)
    assert.equal(entries.length, 1)
    assert.equal(JSON.parse(entries[0]).upstreamStatus, 401)
    assert.equal(entries[0].includes('secret-token'), false)
  } finally {
    console.error = originalError
  }
})
