const test = require('node:test')
const assert = require('node:assert/strict')
const { createDatabaseSslConfig } = require('../src/database/sslConfig')

test('não configura TLS para bancos locais', () => {
  assert.equal(createDatabaseSslConfig({ host: 'localhost' }), undefined)
  assert.equal(createDatabaseSslConfig({ host: '127.0.0.1' }), undefined)
})

test('mantém TLS compatível para banco remoto sem a CA privada', () => {
  assert.deepEqual(createDatabaseSslConfig({ host: 'mysql.example.com' }), {
    rejectUnauthorized: false
  })
})

test('valida o certificado remoto quando a CA é fornecida', () => {
  const certificate = '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----'
  const caBase64 = Buffer.from(certificate).toString('base64')

  assert.deepEqual(createDatabaseSslConfig({ host: 'mysql.example.com', caBase64 }), {
    rejectUnauthorized: true,
    ca: certificate
  })
  assert.deepEqual(createDatabaseSslConfig({
    host: 'mysql.example.com',
    caBase64,
    rejectUnauthorized: 'false'
  }), {
    rejectUnauthorized: false,
    ca: certificate
  })
})
