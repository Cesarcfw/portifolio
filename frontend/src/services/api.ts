/**
 * Módulo responsável por encapsular todas as chamadas HTTP (Fetch) para o Backend.
 * Centraliza a comunicação com a API para facilitar a manutenção e reutilização.
 */
const BASE_URL = 'http://localhost:3000/api'

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