// Manual translations of the fixed choices offered by the administration form.
// Free-form content still requires its own English field; no translation service.
const statusTranslations: Record<string, string> = {
  'Disponível para oportunidades Agora': 'Available for opportunities',
  'Disponível para propostas mas não buscando ativamente': 'Open to offers, not actively looking',
  'Indisponível': 'Currently unavailable',
  'Estagiando': 'Internship',
  'Trabalhando': 'Employed',
  'Freelancer': 'Freelancer',
  'Desempregado': 'Not currently employed',
}

export function statusEnglish(value: string | undefined) {
  return statusTranslations[(value || '').replace('Status atual: ', '')]
}
