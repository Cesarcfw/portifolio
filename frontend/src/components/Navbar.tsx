import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getGithubVersion } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

export default function Navbar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [version, setVersion] = useState('')
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
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-gray-950/95 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
            <img 
              src="/favicon.png" 
              alt="Logo" 
              className="w-8 h-8 rounded-lg group-hover:scale-105 transition-transform" 
            />
            <span className="text-white font-semibold text-sm sm:text-base flex items-center gap-2">
              {isEnglish ? 'Professional portfolio' : 'Portfólio profissional'} <span className="text-teal-400">Dev</span>
              {version && (
                <span className="text-[10px] font-normal bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full scale-90 sm:scale-100">
                  {version}
                </span>
              )}
            </span>
          </Link>

          {/* Links desktop */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'text-white bg-gray-800/80'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
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
              className="ml-2 border border-gray-700 rounded-lg px-3 py-2 text-xs text-teal-400 hover:border-teal-500/50 transition"
              aria-label={isEnglish ? 'Mudar idioma para português' : 'Switch language to English'}
            >
              {isEnglish ? 'PT' : 'EN'}
            </button>
          </div>

          {/* Botão hamburger mobile */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="sm:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-[4px]' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${isOpen ? 'opacity-0 scale-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-300 rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-[4px]' : ''}`} />
          </button>

        </div>
      </div>

      {/* Menu mobile */}
      <div className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-64' : 'max-h-0'}`}>
        <div className="bg-gray-950/98 backdrop-blur-md border-b border-gray-800/50 px-6 py-3 flex flex-col gap-1">
          {links.map(link => (
            <Link
              key={link.path}
              to={link.path}
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
      </div>
    </nav>
  )
}
