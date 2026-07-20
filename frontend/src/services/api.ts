/**
 * Módulo responsável por encapsular todas as chamadas HTTP (Fetch) para o Backend.
 * Centraliza a comunicação com a API para facilitar a manutenção e reutilização.
 */
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

// Projetos
export async function getProjects() {
  const res = await fetch(`${BASE_URL}/projects`)
  return res.json()
}

export async function getFeaturedProjects() {
  const res = await fetch(`${BASE_URL}/projects/featured`)
  return res.json()
}

// GitHub
export async function getGithubRepos() {
  const res = await fetch(`${BASE_URL}/github/repos`)
  return res.json()
}

export async function getGithubContributions() {
  const res = await fetch(`${BASE_URL}/github/contributions`)
  return res.json()
}

export async function getGithubLanguages() {
  const res = await fetch(`${BASE_URL}/github/languages`)
  return res.json()
}

export async function getGithubVersion() {
  const res = await fetch(`${BASE_URL}/github/version`)
  return res.json()
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

export async function uploadResume(token: string, name: string, description: string, base64Data: string, language: 'pt-BR' | 'en') {
  const res = await fetch(`${BASE_URL}/settings/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, description, base64Data, language })
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
