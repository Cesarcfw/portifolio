import { useUiText } from '../hooks/useUiText'

export default function AdminNotice({ message }: { message: string }) {
  const t = useUiText()
  if (!message) return null
  const isError = /^(Erro|Não foi|Preencha|Informe|Selecione)/i.test(message)
  return <p role={isError ? 'alert' : 'status'} className={`admin-notice ${isError ? 'admin-notice-error' : ''}`}>{t(message)}</p>
}
