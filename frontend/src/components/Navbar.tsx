import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const links = [
    { path: '/',         label: 'Home' },
    { path: '/projetos', label: 'Projetos' },
    { path: '/sobre',    label: 'Sobre' },
    { path: '/contato',  label: 'Contato' },
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
            <span className="text-white font-semibold text-sm sm:text-base">
              Portfólio profissional <span className="text-teal-400">Dev</span>
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
        </div>
      </div>
    </nav>
  )
}