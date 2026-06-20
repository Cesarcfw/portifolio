import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface AuthContextType {
  token: string | null
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  function checkToken(currentToken: string | null) {
    if (!currentToken) return false
    try {
      // O JWT tem 3 partes separadas por '.', a segunda é o payload
      const payload = JSON.parse(atob(currentToken.split('.')[1]))
      if (payload.exp * 1000 < Date.now()) {
        return false // Expirado
      }
      return true
    } catch {
      return false
    }
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

  function logout() {
    localStorage.removeItem('portfolio_token')
    setToken(null)
  }

  // Desconectar automaticamente quando o token expirar
  useEffect(() => {
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const timeLeft = payload.exp * 1000 - Date.now()
      
      if (timeLeft <= 0) {
        logout()
      } else {
        const timer = setTimeout(() => {
          alert('Sua sessão expirou. Por favor, faça login novamente.')
          logout()
        }, timeLeft)
        return () => clearTimeout(timer)
      }
    } catch {
      logout()
    }
  }, [token])

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}