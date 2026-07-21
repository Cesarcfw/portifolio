# Frontend do Portfólio

Interface web do portfólio, implementada como uma SPA com React, TypeScript e Vite. Para visão geral, arquitetura completa e execução integrada, consulte o [README principal](../README.md).

## Funcionalidades

- Páginas inicial, projetos, sobre e contato.
- Seletor entre português do Brasil e inglês, com preferência salva em `localStorage`.
- Exibição dos currículos em pares ordenados, mantendo as versões em português do Brasil e inglês lado a lado.
- Formulário administrativo para vincular dois PDFs legados já existentes ou enviar a versão ausente antes da organização em pares.
- Seleção dos campos traduzidos de projetos, habilidades, experiências e configurações conforme o idioma ativo.
- Painel administrativo e tela de redefinição de senha.
- Consumo centralizado da API REST do backend.
- Atualização após eventos `refresh_data` recebidos por Socket.IO.
- Layout responsivo com Tailwind CSS.
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
| `npm run preview` | Serve localmente o build de produção. |

## Estrutura

- `src/components`: componentes compartilhados.
- `src/contexts`: providers e definições de contexto para autenticação e idioma.
- `src/contexts/LanguageContext.tsx`: idioma ativo da interface pública.
- `src/pages`: páginas e painel administrativo.
- `src/services`: cliente da API.

## Deploy

O arquivo `vercel.json` configura o redirecionamento das rotas da SPA para `index.html` e cabeçalhos como CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`. No ambiente publicado, `VITE_API_URL` deve apontar para a URL do backend.

A diretiva `connect-src` da CSP lista explicitamente o backend publicado. Se a API mudar de domínio, atualize essa diretiva e `VITE_API_URL` no mesmo deploy.

Somente a URL pública da API deve usar o prefixo `VITE_`. Tokens, senhas e chaves não podem ser definidos em variáveis `VITE_*`, pois são incluídos no bundle entregue ao navegador.
