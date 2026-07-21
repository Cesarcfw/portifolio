function createResumeError(message, status) {
  const error = new Error(message)
  error.status = status
  return error
}

function linkExistingResumeRecords(resumes, portugueseId, englishId) {
  const portuguese = resumes.find(resume => resume.id === portugueseId)
  const english = resumes.find(resume => resume.id === englishId)

  if (!portuguese || !english) {
    throw createResumeError('Um dos currículos selecionados não foi encontrado', 404)
  }
  if ((portuguese.language || 'pt-BR') !== 'pt-BR' || english.language !== 'en') {
    throw createResumeError('Selecione uma versão em português e outra em inglês', 400)
  }

  const portuguesePairKey = String(portuguese.pairId || portuguese.id)
  const englishPairKey = String(english.pairId || english.id)
  const portugueseGroup = resumes.filter(resume => String(resume.pairId || resume.id) === portuguesePairKey)
  const englishGroup = resumes.filter(resume => String(resume.pairId || resume.id) === englishPairKey)
  if (portugueseGroup.length !== 1 || englishGroup.length !== 1) {
    throw createResumeError('Um dos currículos selecionados já pertence a um par completo', 409)
  }

  const pairId = portuguese.pairId || portuguese.id
  const portugueseIndex = resumes.findIndex(resume => resume.id === portugueseId)
  const englishIndex = resumes.findIndex(resume => resume.id === englishId)
  const candidateOrders = [
    Number(portuguese.order),
    Number(english.order),
    portugueseIndex,
    englishIndex
  ].filter(Number.isFinite)
  const order = Math.min(...candidateOrders)

  const updated = resumes.map(resume => {
    if (resume.id === portugueseId) return { ...resume, pairId, order, language: 'pt-BR' }
    if (resume.id === englishId) return { ...resume, pairId, order, language: 'en' }
    return resume
  })

  return { updated, pairId }
}

module.exports = { linkExistingResumeRecords }
