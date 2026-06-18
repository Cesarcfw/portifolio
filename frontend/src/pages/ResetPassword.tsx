import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { resetPassword } from '../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      setError('Token de recuperação inválido.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setError('')
    setMessage('Atualizando...')
    
    const data = await resetPassword(token, password)
    if (data.error) {
      setMessage('')
      setError(data.error)
    } else {
      setMessage('Senha atualizada com sucesso! Redirecionando...')
      setTimeout(() => {
        navigate('/admin')
      }, 2000)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">Redefinir Senha</h1>
        
        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg px-4 py-3 mb-4 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Nova Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
          <input
            type="password"
            placeholder="Confirmar Nova Senha"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            className="bg-teal-500 hover:bg-teal-600 py-3 rounded-lg font-medium transition"
          >
            Salvar Senha
          </button>
        </form>
      </div>
    </main>
  )
}
