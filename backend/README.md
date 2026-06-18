# Backend - API do Portfólio

Este diretório contém a API REST do projeto, construída usando Node.js, Express, e MySQL. É a ponte entre o banco de dados e o frontend.

## 🗄️ Estrutura e Funcionalidades

* **Autenticação (`/api/auth`)**: Geração e validação de JWTs (JSON Web Tokens). Inclui um fluxo de esqueci a senha que envia e-mails via Nodemailer. Senhas são "cacheadas" no banco de dados usando `bcrypt`.
* **Gerenciamento de Projetos (`/api/projects`)**: API RESTful completa (GET, POST, PUT, DELETE) para gerenciar os projetos do banco de dados. Operações de modificação são protegidas por autenticação.
* **Integração com GitHub (`/api/github`)**: Consome a API do GitHub para buscar repositórios, calcular quantidade de commits em tempo real e desenhar um gráfico de contribuições (via GraphQL).
* **Configurações Globais (`/api/settings`)**: Fornece um mecanismo chave/valor para salvar os textos e status dinâmicos do perfil do administrador.
* **Comunicação em Tempo Real**: Usando `Socket.IO`, o servidor notifica todos os clientes conectados sempre que um dado é alterado no banco de dados, enviando um evento `refresh_data`.

## ⚙️ Variáveis de Ambiente

Na pasta `/backend`, você deve possuir um arquivo `.env` com a seguinte estrutura:

```env
# Servidor e Banco de Dados
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=portfolio

# Autenticação (JWT)
JWT_SECRET=uma_string_aleatoria_super_secreta

# Informações do GitHub
GITHUB_USERNAME=seu_usuario_github
GITHUB_TOKEN=seu_token_de_acesso_pessoal_github

# Envio de E-mails (Nodemailer)
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=senha_de_app_do_gmail
```

## 🛠 Comandos Disponíveis

Navegue até a pasta `/backend` e você poderá utilizar:

* `npm run dev` - Roda o servidor usando o `nodemon`. Sempre que você salvar um arquivo Javascript, o servidor é reiniciado automaticamente.

## 🗃 Banco de Dados

A arquitetura usa MySQL e trabalha com as seguintes tabelas:
* `users` - Para o login do painel administrativo.
* `projects` - Para salvar as informações, links e status dos projetos do portfólio.
* `settings` - Para armazenar customizações (ex: status atual de trabalho, disponibilidade).
