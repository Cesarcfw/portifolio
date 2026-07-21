const test = require('node:test')
const assert = require('node:assert/strict')
const { linkExistingResumeRecords } = require('../src/utils/resumePairs')

test('vincula registros legados em português e inglês sem alterar seus arquivos', () => {
  const resumes = [
    { id: 10, name: 'Currículo', url: '/curriculos/pt.pdf' },
    { id: 20, name: 'Résumé', language: 'en', url: '/curriculos/en.pdf' }
  ]

  const result = linkExistingResumeRecords(resumes, 10, 20)

  assert.equal(result.pairId, 10)
  assert.deepEqual(result.updated.map(resume => resume.language), ['pt-BR', 'en'])
  assert.deepEqual(result.updated.map(resume => resume.pairId), [10, 10])
  assert.deepEqual(result.updated.map(resume => resume.url), ['/curriculos/pt.pdf', '/curriculos/en.pdf'])
})

test('rejeita a inversão dos idiomas ao formar um par', () => {
  const resumes = [
    { id: 10, language: 'en' },
    { id: 20, language: 'pt-BR' }
  ]

  assert.throws(
    () => linkExistingResumeRecords(resumes, 10, 20),
    error => error.status === 400
  )
})

test('não permite reutilizar um currículo que já pertence a um par completo', () => {
  const resumes = [
    { id: 10, pairId: 10, language: 'pt-BR' },
    { id: 11, pairId: 10, language: 'en' },
    { id: 20, language: 'en' }
  ]

  assert.throws(
    () => linkExistingResumeRecords(resumes, 10, 20),
    error => error.status === 409
  )
})
