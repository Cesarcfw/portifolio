const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PDF_DATA_PATTERN = /^data:application\/pdf;base64,([A-Za-z0-9+/]+={0,2})$/

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isValidEmail(value) {
  return value.length <= 254 && EMAIL_PATTERN.test(value)
}

function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 12 && value.length <= 128
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function isHttpUrl(value) {
  if (value === '' || value === null || value === undefined) return true
  if (typeof value !== 'string' || value.length > 2048) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeHttpOrigin(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.search || url.hash || (url.pathname && url.pathname !== '/')) return null
    return url.origin
  } catch {
    return null
  }
}

function getPdfBase64(value, maxBytes = 5 * 1024 * 1024) {
  if (typeof value !== 'string') return null
  const match = value.match(PDF_DATA_PATTERN)
  if (!match) return null

  const base64 = match[1]
  if (!base64.startsWith('JVBERi0')) return null
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  const byteLength = Math.floor((base64.length * 3) / 4) - padding
  return byteLength > 0 && byteLength <= maxBytes ? base64 : null
}

module.exports = {
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  escapeHtml,
  isHttpUrl,
  normalizeHttpOrigin,
  getPdfBase64
}
