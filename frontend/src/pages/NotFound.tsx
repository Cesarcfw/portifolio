import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

export default function NotFound() {
  const { isEnglish } = useLanguage()
  return <main id="main-content" className="portfolio-page min-h-screen">
    <section className="max-w-4xl mx-auto px-6 py-16">
      <h1>{isEnglish ? 'Page not found' : 'Página não encontrada'}</h1>
      <p className="my-6">{isEnglish ? 'This address does not exist or has changed.' : 'Este endereço não existe ou foi alterado.'}</p>
      <Link className="portfolio-button" to="/">{isEnglish ? 'Back to home' : 'Voltar ao início'}</Link>
    </section>
  </main>
}
