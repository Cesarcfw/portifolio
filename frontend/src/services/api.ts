/**
 * Módulo responsável por encapsular todas as chamadas HTTP (Fetch) para o Backend.
 * Centraliza a comunicação com a API para facilitar a manutenção e reutilização.
 */
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

export class ApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

async function getPublic(path: string) {
  const res = await fetch(`${BASE_URL}${path}`)
  const data = await res.json().catch(() => {
    throw new ApiError('API_INVALID_RESPONSE', 'Resposta inválida da API')
  })
  if (!res.ok) throw new ApiError(data.code || 'INTERNAL_ERROR', data.error || 'Erro na API')
  return data
}

// Projetos
export async function getProjects() {
  return getPublic('/projects')
}

export async function getFeaturedProjects() {
  return getPublic('/projects/featured')
}

// GitHub
export async function getGithubRepos() {
  return getPublic('/github/repos')
}

export async function getGithubContributions() {
  return getPublic('/github/contributions')
}

export async function getGithubLanguages() {
  return getPublic('/github/languages')
}

export async function getGithubVersion() {
  return getPublic('/github/version')
}

// Auth
export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  return res.json()
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  return res.json()
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword })
  })
  return res.json()
}

// Settings
export async function getSettings() {
  const res = await fetch(`${BASE_URL}/settings`)
  return res.json()
}

export async function updateSettings(token: string, settings: Record<string, string>) {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  })
  return res.json()
}

interface ResumeUploadData {
  name: string
  description: string
  base64Data: string
}

export async function uploadResumePair(token: string, portuguese: ResumeUploadData, english: ResumeUploadData) {
  const res = await fetch(`${BASE_URL}/settings/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ portuguese, english })
  })
  return res.json()
}

export async function uploadResumeCounterpart(token: string, resumeId: number, counterpart: ResumeUploadData) {
  const res = await fetch(`${BASE_URL}/settings/resume/${resumeId}/counterpart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(counterpart)
  })
  return res.json()
}

export async function replaceResumeFile(token: string, resumeId: number, base64Data: string) {
  const res = await fetch(`${BASE_URL}/settings/resume/${resumeId}/file`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ base64Data })
  })
  return res.json()
}

export async function linkResumeCounterparts(token: string, portugueseId: number, englishId: number) {
  const res = await fetch(`${BASE_URL}/settings/resume/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ portugueseId, englishId })
  })
  return res.json()
}

export async function reorderResumePairs(token: string, pairIds: Array<number | string>) {
  const res = await fetch(`${BASE_URL}/settings/resume/order`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ pairIds })
  })
  return res.json()
}

export async function removeResumePair(token: string, pairId: number | string) {
  const res = await fetch(`${BASE_URL}/settings/resume/pair/${pairId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function editResume(token: string, id: number, name: string, description: string, language: 'pt-BR' | 'en') {
  const res = await fetch(`${BASE_URL}/settings/resume/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, description, language })
  })
  return res.json()
}

export async function removeResume(token: string, id: number) {
  const res = await fetch(`${BASE_URL}/settings/resume/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return res.json()
}

// Skills
export async function getSkills() {
  const res = await fetch(`${BASE_URL}/skills`)
  return res.json()
}

export async function createSkill(token: string, data: { name: string, name_en?: string, category: string, category_en?: string, level?: number, color?: string }) {
  const res = await fetch(`${BASE_URL}/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function updateSkill(token: string, id: number, data: { name: string, name_en?: string, category: string, category_en?: string, level?: number, color?: string }) {
  const res = await fetch(`${BASE_URL}/skills/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function removeSkill(token: string, id: number) {
  const res = await fetch(`${BASE_URL}/skills/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return res.json()
}

// Experiences
export async function getExperiences() {
  const res = await fetch(`${BASE_URL}/experiences`)
  return res.json()
}

export async function createExperience(token: string, data: { company: string, company_en?: string, role: string, role_en?: string, period: string, period_en?: string, description?: string, description_en?: string, techs?: string, type?: string, order_index?: number }) {
  const res = await fetch(`${BASE_URL}/experiences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function updateExperience(token: string, id: number, data: { company: string, company_en?: string, role: string, role_en?: string, period: string, period_en?: string, description?: string, description_en?: string, techs?: string, type?: string, order_index?: number }) {
  const res = await fetch(`${BASE_URL}/experiences/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function removeExperience(token: string, id: number) {
  const res = await fetch(`${BASE_URL}/experiences/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return res.json()
}
