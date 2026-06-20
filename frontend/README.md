# Frontend - Portfólio

Este é o diretório contendo a interface do usuário (UI) do portfólio, construído utilizando React, Vite, TypeScript e Tailwind CSS.

## 🎨 Funcionalidades

* **Página Inicial (Home):** Exibição de informações dinâmicas sobre disponibilidade, habilidades (skills) e gráfico de contribuições do GitHub (heatmap).
* **Projetos:** Lista completa dos projetos desenvolvidos, buscando as informações através da API no backend.
* **Painel Admin:** Interface protegida (`/admin`) para gerenciamento de projetos e configurações do perfil. A tela inclui um formulário de login e funcionalidade de recuperação de senha por e-mail.
* **Atualizações em Tempo Real:** Conectado via `Socket.IO`, qualquer alteração feita no Painel Admin forçará o navegador dos visitantes a recarregar automaticamente para exibir os dados mais recentes.
* **Responsividade:** Layout adaptável para smartphones, tablets e desktops utilizando as classes utilitárias do Tailwind CSS.

## 🛠 Comandos Disponíveis

Navegue até a pasta `/frontend` e você poderá utilizar os seguintes comandos:

* `npm run dev` - Inicia o servidor de desenvolvimento do Vite (com Hot Module Replacement).
* `npm run build` - Gera o pacote otimizado para produção na pasta `dist`.
* `npm run preview` - Inicia um servidor web local servindo os arquivos gerados pelo comando de build.

## 📂 Estrutura de Pastas

* `/src/components`: Componentes reutilizáveis (como Navbar e elementos globais).
* `/src/contexts`: Contextos do React, incluindo o `AuthContext` responsável por gerenciar o estado de login e do token JWT.
* `/src/pages`: Componentes de páginas roteáveis (Home, About, Contact, Projects, Admin, ResetPassword).
* `/src/services`: Funções utilitárias, como o `api.ts`, que abstrai as chamadas `fetch` para o backend.

## 🔌 Configuração da API

As chamadas de API estão apontadas dinamicamente para o backend através da variável de ambiente `VITE_API_URL`.

Para rodar localmente, crie um arquivo `.env.local` na raiz da pasta `/frontend` com o seguinte conteúdo:
```env
VITE_API_URL=http://localhost:3000
```

## ☁️ Deploy na Nuvem (Vercel)

Este projeto foi otimizado para deploy na **Vercel**.
1. Conecte o repositório na plataforma Vercel.
2. Nas configurações do projeto, adicione a variável de ambiente `VITE_API_URL` apontando para o seu backend de produção (ex: `https://seu-backend.onrender.com`).
3. A Vercel executará o comando `npm run build` automaticamente e distribuirá os arquivos estáticos globalmente em sua CDN.
