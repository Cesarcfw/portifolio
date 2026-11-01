import { useLanguage } from '../contexts/LanguageContext'
import { useState } from 'react'
import { englishContent } from '../utils/contentTranslations'

// Never invent a translation or silently label Portuguese content as English.
export default function LocalizedText({ original, english }: { original?: string; english?: string }) {
  const { isEnglish } = useLanguage()
  const [showOriginal, setShowOriginal] = useState(false)
  if (!isEnglish) return <>{original}</>
  const translated = englishContent(original, english)
  if (translated) return <>{translated}</>
  if (!original?.trim()) return null
  return <span className="translation-pending">
    <span>English translation pending. </span>
    <button type="button" aria-expanded={showOriginal} onClick={() => setShowOriginal(!showOriginal)}>
      {showOriginal ? 'Hide Portuguese original' : 'Read Portuguese original'}
    </button>
    {showOriginal && <span lang="pt-BR"> {original}</span>}
  </span>
}
