# Backend do Portfólio

API REST em Node.js e Express responsável por autenticação, regras de negócio, persistência MySQL, integrações externas e eventos em tempo real. Para visão geral e execução integrada, consulte o [README principal](../README.md).

## Responsabilidades

- Autenticação administrativa com JWT e bcrypt.
- CRUD de projetos, habilidades e experiências.
- Gerenciamento de configurações e pares de currículos.
- Cadastro conjunto das versões em português do Brasil (`pt-BR`) e inglês (`en`), vinculadas por `pairId` e ordenadas por `order` no JSON armazenado em `settings`.
- Vínculo entre PDFs legados já cadastrados ou complementação pela inclusão da versão ausente, sem substituir o arquivo original.
- Persistência das versões em inglês de projetos, habilidades e experiências em colunas com sufixo `_en`.
- Consulta às APIs REST e GraphQL do GitHub.
- Envio de contatos, recuperação de senha e alertas com Resend.
- Eventos `refresh_data` via Socket.IO.
- Rate limiting geral da API e limites adicionais nas rotas de autenticação, contato e GitHub, com cache temporário para consultas externas.
- CORS restrito, cabeçalhos HTTP de segurança, validação de entradas e escape do conteúdo enviado por e-mail.

## Variáveis de ambiente

Crie o arquivo local a partir do modelo:

```bash
cp .env.example .env
```

As variáveis reconhecidas pelo código estão documentadas em [`backend/.env.example`](./.env.example) e no [README principal](../README.md#-variáveis-de-ambiente). Não armazene tokens, senhas ou chaves reais no repositório.

`JWT_SECRET` deve possuir pelo menos 32 caracteres. `FRONTEND_URL` define as origens HTTP/HTTPS adicionais aceitas pelo CORS e pode receber uma lista sem caminhos, separada por vírgulas. `ADMIN_SETUP_KEY` é enviada apenas no corpo da criação do primeiro administrador e nunca deve ser exposta no frontend.

## Banco de dados

Crie previamente o banco MySQL indicado por `DB_NAME`. Depois, a partir da raiz do repositório, execute:

```bash
npm run db:migrate
```

O comando deve ser executado na raiz do repositório. Ele chama `backend/src/database/migrate.js`, que cria as tabelas `users`, `projects`, `settings`, `skills` e `experiences`, mas não cria o banco MySQL.

Ao iniciar a API, `src/app.js` também possui uma rotina que garante as tabelas `settings`, `skills` e `experiences` e preenche `skills` e `experiences` quando estão vazias. Essa rotina é executada independentemente da configuração do Resend.

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
| `npm run db:migrate` | Cria ou atualiza as cinco tabelas usando as variáveis de `backend/.env`. |
| `npm test` | Executa os testes locais com o test runner nativo do Node.js. |

Quando `PORT` não é definida, a API usa `http://localhost:3000`.

## Rotas principais

- `/api/auth`: cadastro inicial, login e redefinição de senha.
- `/api/projects`: consulta e gerenciamento de projetos.
- `/api/github`: repositórios, contribuições, linguagens e versão.
- `/api/contact`: envio do formulário de contato.
- `/api/settings`: configurações, cadastro conjunto, ordenação, edição e remoção de pares de currículos.
- `/api/skills`: consulta e gerenciamento de habilidades.
- `/api/experiences`: consulta e gerenciamento de experiências.

As operações administrativas de alteração são protegidas por autenticação, conforme definido nas rotas do backend.

## Controles de segurança

- O cadastro inicial exige `ADMIN_SETUP_KEY` e fica indisponível depois da criação do primeiro usuário.
- A criação inicial utiliza um bloqueio exclusivo no MySQL para impedir que requisições concorrentes criem mais de um administrador.
- Senhas novas exigem de 12 a 128 caracteres; links de recuperação usam a origem configurada em `FRONTEND_URL`.
- O retorno da recuperação de senha não confirma se um e-mail está cadastrado.
- Tokens de recuperação são vinculados à senha atual e não podem ser reutilizados após uma redefinição bem-sucedida.
- PDFs são validados pelo tipo, assinatura inicial e limite de 5 MB antes do envio ao GitHub.
- O token do GitHub deve ser refinado e limitado ao repositório do portfólio, com acesso de conteúdo compatível com as consultas e o upload de PDFs.
- A conexão MySQL remota utiliza TLS. Quando o provedor fornecer uma CA privada, codifique o arquivo em Base64 e configure `DB_SSL_CA_BASE64`; nessa condição, o certificado é validado por padrão. Sem a CA, o código mantém a conexão criptografada em modo de compatibilidade, sem validar a cadeia. Use `DB_SSL_REJECT_UNAUTHORIZED=false` somente para diagnóstico quando uma CA estiver configurada.
- As chamadas ao GitHub possuem tempo limite para que indisponibilidades externas não mantenham requisições abertas indefinidamente.

No fluxo atual, remover um currículo pelo painel remove seu metadado de `resumes_links`, mas não apaga o PDF já versionado nem seu histórico no GitHub. A exclusão completa deve ser tratada em uma alteração futura e coordenada no repositório.
