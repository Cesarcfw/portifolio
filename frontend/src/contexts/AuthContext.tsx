import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './auth-context'

function getTokenExpiration(currentToken: string | null): number | null {
  if (!currentToken) return null
  try {
    const encodedPayload = currentToken.split('.')[1]
    if (!encodedPayload) return null
    const base64 = encodedPayload.replaceAll('-', '+').replaceAll('_', '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  function checkToken(currentToken: string | null) {
    const expiration = getTokenExpiration(currentToken)
    return expiration !== null && expiration > Date.now()
  }

  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('portfolio_token')
    if (saved && !checkToken(saved)) {
      localStorage.removeItem('portfolio_token')
      return null
    }
    return saved
  })

  function login(newToken: string) {
    localStorage.setItem('portfolio_token', newToken)
    setToken(newToken)
  }

  const logout = useCallback(() => {
    localStorage.removeItem('portfolio_token')
    setToken(null)
  }, [])

  // Desconectar automaticamente quando o token expirar
  useEffect(() => {
    if (!token) return
    const expiration = getTokenExpiration(token)
    const timeLeft = Math.max(0, (expiration || 0) - Date.now())
    const timer = setTimeout(() => {
      if (timeLeft > 0) alert('Sua sessão expirou. Por favor, faça login novamente.')
      logout()
    }, timeLeft)
    return () => clearTimeout(timer)
  }, [token, logout])

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}
