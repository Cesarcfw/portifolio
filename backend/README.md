# Backend do Portfólio

API REST em Node.js e Express responsável por autenticação, regras de negócio, persistência MySQL, integrações externas e eventos em tempo real. Para visão geral e execução integrada, consulte o [README principal](../README.md).

## Responsabilidades

- Autenticação administrativa com JWT e bcrypt.
- CRUD de projetos, habilidades e experiências.
- Gerenciamento de configurações e currículos.
- Consulta às APIs REST e GraphQL do GitHub.
- Envio de contatos, recuperação de senha e alertas com Resend.
- Eventos `refresh_data` via Socket.IO.
- Rate limiting nas rotas de autenticação e contato.

## Variáveis de ambiente

Crie o arquivo local a partir do modelo:

```bash
cp .env.example .env
```

As variáveis reconhecidas pelo código estão documentadas em [`backend/.env.example`](./.env.example) e no [README principal](../README.md#-variáveis-de-ambiente). Não armazene tokens, senhas ou chaves reais no repositório.

## Banco de dados

Crie previamente o banco MySQL indicado por `DB_NAME`. Depois, a partir da raiz do repositório, execute:

```bash
node backend/src/database/migrate.js
```

O script cria as tabelas `users`, `projects`, `settings`, `skills` e `experiences`. Ele não cria o banco MySQL e não possui comando npm próprio.

## Comandos

Execute dentro de `backend/`:

```bash
npm install
npm run dev
```

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia a API com reinicialização automática pelo nodemon. |
| `npm start` | Inicia a API com Node.js. |

Quando `PORT` não é definida, a API usa `http://localhost:3000`.

## Rotas principais

- `/api/auth`: cadastro inicial, login e redefinição de senha.
- `/api/projects`: consulta e gerenciamento de projetos.
- `/api/github`: repositórios, contribuições, linguagens e versão.
- `/api/contact`: envio do formulário de contato.
- `/api/settings`: configurações e currículos.
- `/api/skills`: consulta e gerenciamento de habilidades.
- `/api/experiences`: consulta e gerenciamento de experiências.

As operações administrativas de alteração são protegidas por autenticação, conforme definido nas rotas do backend.
