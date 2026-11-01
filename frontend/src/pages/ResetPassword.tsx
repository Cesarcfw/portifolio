import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { resetPassword } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

export default function ResetPassword() {
  const { isEnglish } = useLanguage()
  const [searchParams] = useSearchParams()
  const [token] = useState(() => searchParams.get('token'))
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [complete, setComplete] = useState(false)
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (token) window.history.replaceState({}, document.title, window.location.pathname)
  }, [token])
  useEffect(() => () => { if (redirectTimer.current) clearTimeout(redirectTimer.current) }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (pending || complete) return
    if (!token) {
      setError(isEnglish ? 'Invalid recovery token.' : 'Token de recuperação inválido.')
      return
    }
    if (password !== confirmPassword) {
      setError(isEnglish ? 'Passwords do not match.' : 'As senhas não coincidem.')
      return
    }
    if (password.length < 12 || password.length > 128) {
      setError(isEnglish ? 'The password must contain between 12 and 128 characters.' : 'A senha deve ter entre 12 e 128 caracteres.')
      return
    }

    setError('')
    setMessage(isEnglish ? 'Updating...' : 'Atualizando...')
    
    setPending(true)
    try {
      const data = await resetPassword(token, password)
      if (data.error) {
        setMessage('')
        setError(isEnglish ? 'The recovery link is invalid, expired, or has already been used.' : data.error)
      } else {
        setMessage(isEnglish ? 'Password updated successfully. Redirecting...' : 'Senha atualizada com sucesso! Redirecionando...')
        setComplete(true)
        redirectTimer.current = setTimeout(() => {
          navigate('/admin')
        }, 2000)
      }
    } catch {
      setMessage('')
      setError(isEnglish ? 'Unable to update the password. Check your connection or request a new recovery link, then try again.' : 'Não foi possível atualizar a senha. Confira a conexão ou solicite um novo link de recuperação e tente novamente.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main id="main-content" className="admin-page auth-page">
      <div className="auth-card">
        <h1 className="text-2xl font-bold mb-6">{isEnglish ? 'Reset password' : 'Redefinir senha'}</h1>
        <p id="password-help" className="auth-description">{isEnglish ? 'Use 12 to 128 characters. Confirm your new password below.' : 'Use de 12 a 128 caracteres. Confirme sua nova senha abaixo.'}</p>
        
        {error && (
          <div role="alert" className="admin-notice bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="admin-notice bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg px-4 py-3 mb-4 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <label htmlFor="new-password">{isEnglish ? 'New password' : 'Nova senha'}</label>
          <input
            id="new-password"
            aria-describedby="password-help"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            placeholder={isEnglish ? 'New password' : 'Nova senha'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
          <label htmlFor="confirm-password">{isEnglish ? 'Confirm new password' : 'Confirmar nova senha'}</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            placeholder={isEnglish ? 'Confirm new password' : 'Confirmar nova senha'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            disabled={pending || complete}
            className="bg-teal-500 hover:bg-teal-600 py-3 rounded-lg font-medium transition"
          >
            {pending ? (isEnglish ? 'Saving…' : 'Salvando…') : (isEnglish ? 'Save password' : 'Salvar senha')}
          </button>
        </form>
        <a className="auth-back" href="/admin">{isEnglish ? 'Back to sign in' : 'Voltar ao acesso administrativo'}</a>
      </div>
    </main>
  )
}
