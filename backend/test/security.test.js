const test = require('node:test')
const assert = require('node:assert/strict')
const {
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  escapeHtml,
  isHttpUrl,
  normalizeHttpOrigin,
  getPdfBase64
} = require('../src/utils/security')

test('normaliza e valida e-mails sem aceitar formatos incompletos', () => {
  assert.equal(normalizeEmail('  Admin@Example.COM '), 'admin@example.com')
  assert.equal(isValidEmail('admin@example.com'), true)
  assert.equal(isValidEmail('admin@localhost'), false)
})

test('aplica o intervalo de tamanho definido para senhas novas', () => {
  assert.equal(isValidPassword('123456789012'), true)
  assert.equal(isValidPassword('curta'), false)
  assert.equal(isValidPassword('x'.repeat(129)), false)
})

test('escapa caracteres com significado em HTML', () => {
  assert.equal(escapeHtml('<script>"x" & y</script>'), '&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;')
})

test('aceita somente URLs HTTP e HTTPS', () => {
  assert.equal(isHttpUrl('https://example.com/path'), true)
  assert.equal(isHttpUrl('http://localhost:3000'), true)
  assert.equal(isHttpUrl('javascript:alert(1)'), false)
})

test('normaliza origens HTTP sem aceitar caminhos ou credenciais', () => {
  assert.equal(normalizeHttpOrigin('https://example.com/'), 'https://example.com')
  assert.equal(normalizeHttpOrigin('https://example.com/path'), null)
  assert.equal(normalizeHttpOrigin('https://user:pass@example.com'), null)
})

test('aceita um PDF identificado pelo MIME e pela assinatura do arquivo', () => {
  const pdf = Buffer.from('%PDF-1.4\nconteudo').toString('base64')
  assert.equal(getPdfBase64(`data:application/pdf;base64,${pdf}`), pdf)
  assert.equal(getPdfBase64(`data:text/plain;base64,${pdf}`), null)
  assert.equal(getPdfBase64(`data:application/pdf;base64,${Buffer.from('arquivo').toString('base64')}`), null)
})
