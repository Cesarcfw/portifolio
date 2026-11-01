// Reviewed, manual translations of the public content currently published.
// Exact text matching avoids applying a stale translation after an edit.
// New content should use its English fields in the administration form.
export const contentTranslations: Record<string, string> = {
  'Site e-simon': 'e-simon website',
  'Dashboard e-simon': 'e-simon dashboard',
  'Site para divulgação e contato do e-simon.': 'Website presenting e-simon and providing contact information.',
  'Dashboard para monitoramento de estações de recarga de veículos elétricos em condomínios.': 'Dashboard for monitoring electric vehicle charging stations in residential complexes.',
  'Infraestrutura': 'Infrastructure',
  'Ferramentas': 'Tools',
  'Banco de dados': 'Databases',
  'Frontend': 'Frontend',
  'Backend': 'Backend',
  'Centro de Ensino Universitário do Distrito Federal (UDF)': 'Centro de Ensino Universitário do Distrito Federal (UDF)',
  'MTEC Energia': 'MTEC Energia',
  'Ciência da Computação': 'Computer Science',
  'Conclusão prevista: 12/2026': 'Expected graduation: December 2026',
  'Estagiário de TI': 'IT Intern',
  'Jovem Aprendiz': 'Apprentice',
  'Young Apprentice': 'Apprentice',
  '2025 - Atualmente': '2025–Present',
  '2025 - at the moment': '2025–Present',
  '2024 - 2025': '2024–2025',
  'Desenvolvimento de sistemas Full Stack, automações, análise de dados, suporte de TI, construção e manutenção de site.': 'Full-stack systems development, automation, data analysis, IT support, and website development and maintenance.',
  'Desenvolvimento de sistemas Full Stack, análise de dados, construção e manutenção de site.': 'Full-stack systems development, data analysis, and website development and maintenance.',
  'Escolha a versão do meu currículo que melhor se encaixa na oportunidade. Disponibilizo currículos direcionados para diferentes áreas de atuação, mantendo o foco principal em desenvolvimento de software, backend, full-stack e automação.': 'Choose the résumé that best matches the opportunity. I provide versions tailored to different roles, focusing on software development, backend and full-stack development, and automation.',
  'Curriculo Brasil': 'Résumé — Brazil',
  'Currículo Brasil': 'Résumé — Brazil',
  'Resume International EN': 'International résumé',
  'Currículo atualizado com minha experiência em desenvolvimento de software, backend, integrações e automação de processos, além de projetos, competências técnicas e formação acadêmica.': 'An up-to-date résumé covering my experience in software development, backend systems, integrations, and process automation, along with projects, technical skills, and education.',
  'Portfólio full-stack com React, TypeScript, Node.js e MySQL, com frontend e backend separados.': 'Full-stack portfolio built with React, TypeScript, Node.js, and MySQL, with separate frontend and backend applications.',
  'Projeto acadêmico sobre programação em Java e Programação Orientada a Objetos': 'Academic project covering Java programming and object-oriented programming.',
  'Repositório voltado para atividades e projetos feitos em sala de aula': 'Repository for classroom exercises and projects.',
  'Atividade faculdade: Projeto de site para comandos de musica': 'College assignment: a website project for music commands.',
}

// Product and technology names retain their spelling in both languages.
for (const name of ['Apache', 'Cloudflare', 'CSS', 'Docker', 'Express', 'Git', 'HTML', 'Java', 'Make', 'MySQL', 'Node-RED', 'Node.js', 'PM2', 'Python', 'React', 'SQL', 'Tailwind', 'TypeScript', 'Ubuntu Server', 'Vue.js', 'WordPress']) {
  contentTranslations[name] = name
}

export function englishContent(original?: string | null, english?: string | null): string | undefined {
  const explicit = english?.trim()
  if (explicit) return contentTranslations[explicit] || explicit
  return original?.trim() ? contentTranslations[original.trim()] : ''
}
