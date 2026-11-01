# Direção visual do portfólio

## Identidade e escopo

Evolução da interface existente, preservando rotas, contratos da API, dados administráveis, autenticação e operações de currículos. A referência aprovada é a composição do projeto “Portfólio César — Nova versão” no Stitch, adaptada ao conteúdo real e à preferência por pixel art.

O público principal são recrutadores e equipes técnicas. A página inicial apresenta César, os projetos profissionais, a atividade e os repositórios do GitHub. As páginas Sobre e Contato mantêm os currículos, a trajetória, as habilidades e os canais de contato existentes.

O posicionamento profissional é “Desenvolvedor Backend / Full Stack” (“Backend / Full Stack Developer”), com ênfase em APIs, integrações, autenticação e bancos de dados, preservando a experiência com interfaces. Esse posicionamento aparece abaixo do nome, independentemente da bio administrável. A bio salva no painel continua tendo prioridade sobre o texto padrão: os placeholders sugerem a nova redação, mas não sobrescrevem conteúdo cadastrado. Relatos históricos de experiências e descrições de projetos Full Stack são mantidos.

## Sistema visual

- Fundo azul-escuro `#111724` e superfície `#1B2537`.
- Texto principal `#F0F4FC` e secundário `#B5C2D8`.
- Verde-claro `#BAF2AA` para a ação principal; ciano `#70E3EF` para links e foco.
- Azul `#84ADFF` e roxo `#BA9CF4` como acentos complementares escolhidos pelo autor.
- Space Grotesk variável, hospedada localmente com a licença SIL Open Font License.
- Títulos alinhados à esquerda, sem texto em gradiente; espaçamento e escala tipográfica definem a hierarquia.
- Cabeçalho e seções compartilham o alinhamento de conteúdo. No celular, a abertura passa para uma coluna e o menu é recolhido.

As regras da interface pública estão em `frontend/src/index.css`, sob `.portfolio-page`. O painel e as telas de acesso usam `frontend/src/admin.css`, sob `.admin-page`, mantendo formulários e operações. O cabeçalho compartilha a mesma identidade.

## Painel e acesso administrativo

Modo Operate: a prioridade é editar conteúdo com clareza, sem animações de entrada ou elementos decorativos. O painel preserva as cinco áreas existentes: projetos, currículos, habilidades, experiências e configurações. Login, recuperação pelo formulário de acesso e redefinição de senha recebem o mesmo sistema visual.

- Base de composição: `true-black-flat`, seed `989909898`, adaptada à paleta e à navegação existentes. Não se adicionou uma barra lateral nem métricas fictícias.
- Títulos de 24–28 px, texto de 14 px, metadados de 13 px e controles com pelo menos 44 px de altura.
- Botões de seção com estado pressionado e indicação ativa imediata, sem aguardar animação. Verde-claro é reservado para ações principais e seleção; exclusões usam texto e contorno de alerta.
- Rótulos visíveis associados aos campos. O componente `AdminField` gera identificadores únicos sem modificar valores, eventos ou contratos de envio.
- Formulários em colunas no desktop e empilhados no celular. Os pares de currículos mantêm o agrupamento por português/inglês; as versões são empilhadas em telas estreitas.
- Estados de carregamento e falha da leitura inicial do painel, com opção de tentar novamente. Mensagens de formulário usam regiões de status ou alerta.
- Foco visível, campos de senha com preenchimento automático apropriado, instrução de 12–128 caracteres na redefinição e links para voltar ao acesso/portfólio.
- Movimento restrito ao feedback curto dos controles. Movimento reduzido desativa esses deslocamentos.

Exceções intencionais à referência genérica: fundo azul-escuro, Space Grotesk, ação verde-clara, navegação superior já existente e formulário de acesso centralizado. A identidade foi preservada, não substituída por um tema preto de outra categoria. As áreas vazias ao redor do login são espaço intencional para uma tarefa única, não locais para preencher com ilustrações.

## Imagem e movimento

A abertura usa a cena em pixel art fornecida pelo autor: desenvolvedor no computador e Dachshund dormindo. Não é uma demonstração de API nem uma captura de um ambiente real.

- `frontend/public/media/workspace.mp4`: versão H.264 em 1280 × 720, sem áudio, aproximadamente 516 KB.
- `frontend/public/media/workspace-poster.webp`: imagem estática de aproximadamente 45 KB.
- O original não foi alterado; a transição entre o fim e o início do vídeo não é garantidamente perfeita.
- O vídeo pausa fora da área visível e quando a aba fica oculta.
- Com movimento reduzido, a reprodução automática fica desativada. A pessoa pode iniciar a cena explicitamente.
- Há controle de reprodução/pausa e imagem de fallback em caso de falha.
- Microinterações curtas, sem capturar a rolagem, adicionar cursores personalizados ou esconder conteúdo atrás de animações.

## Decisões de composição

Taste orientou a composição e a revisão em desktop/tablet/celular; Impeccable orientou a hierarquia, os estados e o acabamento; Emil Design Engineering orientou os limites de movimento e o feedback dos controles.

Exceções intencionais às recomendações genéricas dessas ferramentas:

- A grade de seis repositórios em duas linhas de três no desktop foi preservada por solicitação do autor. As informações continuam vindo da API.
- O roxo faz parte da paleta escolhida; não deve ser eliminado por uma regra genérica de estilo.
- A cena fornecida é a mídia principal. Não se acrescentaram fotografias de banco de imagens para atingir uma contagem arbitrária.
- O calendário mantém rolagem horizontal em telas pequenas para preservar sua leitura temporal, sem causar transbordamento da página.
- Divisórias discretas de navegação, calendário e rodapé foram mantidas. Não há uma meta mínima de elementos animados.

## Verificação e limites

A verificação deve incluir `npm run check`, as quatro páginas públicas nos dois idiomas e os tamanhos de 1440, 768 e 390 px. Conferir também foco de teclado, menu móvel, pares PT/EN de currículos, links, controles do vídeo e movimento reduzido.

Os artefatos locais de inspeção ficam em `.taste-skill/`, ignorado pelo Git. Os verificadores de estilo são auxiliares: seus alertas não equivalem automaticamente a defeitos funcionais nem a aprovação visual.

Na revisão de 1º de novembro de 2026, o build de produção passou na inspeção com as exceções acima, sem falhas e com três avisos: contorno do seletor de idioma, tamanhos tipográficos responsivos e rolagem interna do calendário. Os testes de navegador cobriram 24 combinações de página/idioma/tamanho, reprodução do vídeo, movimento reduzido, falhas simuladas da API e do vídeo e sucesso do contato com a requisição interceptada localmente.

Os textos públicos atuais têm traduções manuais revisadas em `contentTranslations.ts`, incluindo projetos, trajetória, habilidades, metadados dos currículos e descrições dos repositórios GitHub. Campos ingleses personalizados têm prioridade; o catálogo também corrige equivalentes em português e traduções antigas conhecidas. Textos novos ou alterados sem correspondência não recebem uma tradução inventada: exibem indicação de pendência e acesso explícito ao original. Nomes próprios, tecnologias, identificadores dos repositórios e o conteúdo dos PDFs são preservados. Não há serviço externo de tradução.

O painel acompanha o idioma ativo em rótulos, mensagens, confirmações e estados. As versões inglesas revisadas dos registros conhecidos são sugeridas nos campos de edição e só são persistidas quando o autor salva. Os valores destinados aos campos em português e os identificadores usados pela API continuam intactos.

## Correções de robustez e adaptação

- Home, Projetos, Sobre e Contato carregam recursos independentes, com estados de falha/vazio e repetição por seção. Uma falha do GitHub não substitui a apresentação inteira. As linguagens do GitHub não permanecem em carregamento após falha ou resposta vazia.
- `refresh_data` atualiza os recursos públicos sem recarregar o documento. Formulários de contato e administração não são descartados por esse evento.
- O cliente HTTP rejeita respostas sem sucesso e corpos de erro. O painel preserva os campos em falhas de gravação, bloqueia operações concorrentes e diferencia mensagens de erro. Login, recuperação e redefinição terminam o estado pendente mesmo em falhas de rede.
- O destino `#curriculos` é estável e reposicionado após a leitura dos PDFs. As versões permanecem no mesmo grupo, em colunas no desktop e empilhadas no celular.
- O calendário mantém um dia na sequência de Tab e usa setas/Home/End para navegação; ponteiros de toque recebem alvos de 44 px e rolagem interna.
- O menu recolhido se estende até 767 px; títulos e estados dos projetos podem quebrar linha em telas de 320 px. Rotas inexistentes mostram uma página de orientação com retorno ao início.

Não foram enviadas mensagens reais nem executadas operações administrativas de escrita durante a revisão visual.

A extensão ao painel foi verificada com dados sintéticos e todas as chamadas de API interceptadas no navegador. Foram percorridas as cinco áreas, login e redefinição nos tamanhos 1440, 768 e 390 px; a redefinição também foi conferida em inglês. Os testes cobriram cadastro/edição/exclusão de projetos, habilidades e experiências; upload de pares, edição, substituição de PDF, ordenação, vínculo e complemento de currículos legados; configurações; entrada/saída; solicitação de recuperação e validações/redirecionamento da redefinição. Isso valida o comportamento da interface e seus contratos de envio, sem comprovar gravações reais no banco, GitHub ou serviço de e-mail. Nenhuma credencial real foi utilizada nos testes do painel.
