import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getGithubVersion } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

export default function Navbar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [version, setVersion] = useState('')
  const menuButton = useRef<HTMLButtonElement>(null)
  const { language, setLanguage, isEnglish } = useLanguage()

  useEffect(() => {
    getGithubVersion()
      .then(data => {
        if (data && data.version) {
          setVersion(data.version)
        }
      })
      .catch(console.error)
  }, [])

  const links = [
    { path: '/',         label: 'Home' },
    { path: '/projetos', label: isEnglish ? 'Projects' : 'Projetos' },
    { path: '/sobre',    label: isEnglish ? 'About' : 'Sobre' },
    { path: '/contato',  label: isEnglish ? 'Contact' : 'Contato' },
  ]

  return (
    <nav aria-label={isEnglish ? 'Main navigation' : 'Navegação principal'} className="portfolio-nav fixed top-0 left-0 right-0 z-50">
      <a className="skip-link" href="#main-content">{isEnglish ? 'Skip to content' : 'Ir para o conteúdo'}</a>
      <div className="nav-surface">
        <div className="nav-inner mx-auto px-6 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0 whitespace-nowrap" onClick={() => setIsOpen(false)}>
            <img 
              src="/favicon.png" 
              alt=""
              className="w-8 h-8 rounded-lg group-hover:scale-105 transition-transform" 
            />
            <span className="text-white font-semibold text-sm sm:text-base flex items-center gap-2">
              César<span className="nav-wordmark-detail"> / dev</span>
              {version && (
                <span className="text-[13px] font-normal bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">
                  {version}
                </span>
              )}
            </span>
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                aria-current={location.pathname === link.path ? 'page' : undefined}
                className={`relative px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'nav-link is-current'
                    : 'nav-link'
                }`}
              >
                {link.label}
                {location.pathname === link.path && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-400 rounded-full" />
                )}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR')}
              className="language-toggle"
              aria-label={isEnglish ? 'Switch language to Portuguese (Brazil)' : 'Mudar idioma para inglês'}
            >
              {isEnglish ? 'PT' : 'EN'}
            </button>
          </div>

          {/* Botão hamburger mobile */}
          <button
            ref={menuButton}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden relative w-11 h-11 flex flex-col items-center justify-center gap-1.5"
            aria-label="Menu"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            onKeyDown={event => { if (event.key === 'Escape') setIsOpen(false) }}
          >
            <span className={`block w-5 h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-[4px]' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${isOpen ? 'opacity-0 scale-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-[4px]' : ''}`} />
          </button>

        </div>
      </div>

      {/* Menu mobile */}
      {isOpen && <div id="mobile-navigation" className="mobile-navigation md:hidden" onKeyDown={event => { if (event.key === 'Escape') { setIsOpen(false); menuButton.current?.focus() } }}>
        <div className="px-6 py-3 flex flex-col gap-1">
          {links.map(link => (
            <Link
              key={link.path}
              to={link.path}
              aria-current={location.pathname === link.path ? 'page' : undefined}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                location.pathname === link.path
                  ? 'text-white bg-gray-800/80'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {location.pathname === link.path && (
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
              )}
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR')
              setIsOpen(false)
            }}
            className="px-4 py-3 rounded-xl text-left text-sm text-teal-400 hover:bg-gray-800/50 transition"
          >
            {isEnglish ? 'Português (Brasil)' : 'English'}
          </button>
        </div>
      </div>}
    </nav>
  )
}
