import { useLanguage } from '../contexts/LanguageContext'

export default function ResourceStatus({ loading, error, retry, empty = false }: {
  loading: boolean; error: boolean; retry: () => void; empty?: boolean
}) {
  const { isEnglish } = useLanguage()
  if (error) return <div className="resource-status" role="alert">
    <p>{isEnglish ? 'This section could not be loaded. Other sections remain available.' : 'Não foi possível carregar esta seção. As demais continuam disponíveis.'}</p>
    <button type="button" className="portfolio-link" onClick={retry}>{isEnglish ? 'Try again' : 'Tentar novamente'}</button>
  </div>
  if (loading) return <p role="status">{isEnglish ? 'Loading this section…' : 'Carregando esta seção…'}</p>
  if (empty) return <p>{isEnglish ? 'No information available yet.' : 'Nenhuma informação disponível no momento.'}</p>
  return null
}
