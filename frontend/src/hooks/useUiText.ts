import { useLanguage } from '../contexts/LanguageContext'
import { englishUi } from '../utils/uiTranslations'

export function useUiText() {
  const { isEnglish } = useLanguage()
  return (text: string) => isEnglish ? englishUi(text) : text
}
