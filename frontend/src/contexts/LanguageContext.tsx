import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type Language = 'pt-BR' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  isEnglish: boolean
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('portfolio_language')
    return saved === 'en' ? 'en' : 'pt-BR'
  })

  useEffect(() => {
    localStorage.setItem('portfolio_language', language)
    document.documentElement.lang = language
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isEnglish: language === 'en' }}>
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  return useContext(LanguageContext)
}
