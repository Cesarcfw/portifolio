# Frontend do Portfólio

Interface web do portfólio, implementada como uma SPA com React, TypeScript e Vite. Para visão geral, arquitetura completa e execução integrada, consulte o [README principal](../README.md).

## Funcionalidades

- Páginas inicial, projetos, sobre e contato.
- Seletor entre português do Brasil e inglês, com preferência salva em `localStorage`.
- Exibição dos currículos em pares ordenados, mantendo as versões em português do Brasil e inglês lado a lado.
- Formulário administrativo para vincular dois PDFs legados já existentes ou enviar a versão ausente antes da organização em pares.
- Seleção dos campos traduzidos de projetos, habilidades, experiências e configurações conforme o idioma ativo.
- Painel administrativo e tela de redefinição de senha.
- Painel com cinco áreas de edição, campos rotulados, feedback de carregamento/falha e layouts adaptados a desktop e celular.
- Consumo centralizado da API REST do backend.
- Atualização após eventos `refresh_data` recebidos por Socket.IO.
- Layout responsivo com Tailwind CSS.
- Identidade visual e critérios de interação descritos em [DESIGN.md](../DESIGN.md).
- Cena de abertura em pixel art com controle de reprodução, poster estático e respeito à preferência por movimento reduzido.
- Cabeçalhos de segurança configurados no deploy da Vercel.

## Variável de ambiente

Crie o arquivo local a partir do modelo:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3000
```

`VITE_API_URL` deve conter a URL base do backend, sem `/api`. Quando a variável não é definida, o código usa `http://localhost:3000`.

## Comandos

Execute dentro de `frontend/`:

```bash
npm install
npm run dev
```

O Vite utiliza `http://localhost:5173` por padrão na configuração atual.

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Valida o TypeScript e gera o build em `dist/`. |
| `npm run lint` | Executa o ESLint. |
| `npm test` | Testa a rejeição de erros HTTP, falhas de rede e respostas inválidas do cliente da API, sem acessar serviços reais. |
| `npm run preview` | Serve localmente o build de produção. |

## Estrutura

- `src/components`: componentes compartilhados.
- `src/contexts`: providers e definições de contexto para autenticação e idioma.
- `src/contexts/LanguageContext.tsx`: idioma ativo da interface pública.
- `src/pages`: páginas e painel administrativo.
- `src/services`: cliente da API.
- `src/hooks/useResource.ts`: carregamento independente, repetição e atualização de cada seção pública.
- `src/components/WorkspaceScene.tsx`: ciclo de reprodução da cena de abertura.
- `src/components/AdminField.tsx`: associação entre rótulos e controles do painel.
- `src/admin.css`: estilos isolados das telas de administração e acesso.
- `public/media`: vídeo otimizado e poster da cena fornecida pelo autor.
- `public/fonts`: fonte local Space Grotesk e sua licença SIL Open Font License.

## Estados e idiomas

Falhas de serviços externos são apresentadas por seção, sem substituir toda a página. O evento Socket.IO `refresh_data` atualiza os recursos públicos sem recarregar o documento ou apagar formulários em edição.

Textos administráveis usam os campos em inglês quando disponíveis. Os textos públicos atuais sem versão inglesa têm traduções manuais revisadas em `src/utils/contentTranslations.ts`, incluindo descrições de projetos, experiências, categorias, metadados dos currículos e descrições dos repositórios do GitHub. Nomes próprios e identificadores dos repositórios são preservados.

O catálogo usa correspondência exata: se um texto novo ou alterado não tiver versão inglesa, a interface sinaliza a pendência e oferece o original. Não há serviço de tradução automática, token ou envio de conteúdo a um tradutor externo. Os campos ingleses do painel recebem as sugestões revisadas dos textos conhecidos, sem gravação automática: é necessário salvar para persistir no banco. Conteúdo personalizado em inglês tem prioridade; equivalentes conhecidos em português e traduções antigas revisadas são normalizados pelo catálogo.

O painel também acompanha o idioma selecionado, incluindo rótulos, mensagens, confirmações e estados vazios. Os campos destinados a conteúdo em português continuam exibindo os valores originais para edição; nomes de propriedades, valores internos, rotas e contratos da API não são traduzidos. A região do painel usa o idioma ativo. Os PDFs não são modificados: a identificação PT-BR/EN indica o idioma real do documento, independentemente do idioma da interface.

Os currículos mantêm o agrupamento e a identificação PT-BR/EN: duas colunas em telas maiores e versões empilhadas dentro do mesmo par no celular. A âncora `#curriculos` também existe durante carregamento, ausência ou falha dos dados.

O calendário tem uma única entrada por Tab e navegação por setas, Home e End. Em dispositivos com ponteiro de toque, os dias recebem alvos de 44 px, mantendo a rolagem horizontal dentro da seção.

## Deploy

O arquivo `vercel.json` configura o redirecionamento das rotas da SPA para `index.html` e cabeçalhos como CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`. No ambiente publicado, `VITE_API_URL` deve apontar para a URL do backend.

A diretiva `connect-src` da CSP lista explicitamente o backend publicado. Se a API mudar de domínio, atualize essa diretiva e `VITE_API_URL` no mesmo deploy.

Somente a URL pública da API deve usar o prefixo `VITE_`. Tokens, senhas e chaves não podem ser definidos em variáveis `VITE_*`, pois são incluídos no bundle entregue ao navegador.
