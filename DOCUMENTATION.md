# Documentação técnica — Portfólio Full-Stack

Este documento detalha a arquitetura, o fluxo de dados e a estrutura de diretórios do projeto de Portfólio Profissional. A aplicação separa frontend, backend, persistência de dados, autenticação administrativa e comunicação em tempo real.

---

## 1. Arquitetura Geral

O projeto adota uma arquitetura **Cliente-Servidor (Client-Server)** desacoplada:
* **Frontend (Cliente):** Um Single Page Application (SPA) em React (construído com Vite), utilizando TypeScript, Tailwind CSS e um contexto para alternar a interface pública entre português do Brasil e inglês.
* **Backend (Servidor):** Uma API RESTful em Node.js com Express, que expõe endpoints para acesso aos dados e gerencia a lógica de negócios e segurança.
* **Banco de Dados:** MySQL, responsável pela persistência de usuários, projetos, configurações, habilidades e experiências.
* **Comunicação em Tempo Real:** O `Socket.IO` permite notificar clientes conectados após alterações administrativas.

---

## 2. Banco de Dados (MySQL)

A aplicação utiliza cinco tabelas, criadas por `backend/src/database/migrate.js`:

1. **`users`**
   * **Propósito:** Armazenar as credenciais do administrador.
   * **Colunas:** `id`, `email`, `password_hash`, `created_at`.
   
2. **`projects`**
   * **Propósito:** Armazenar os projetos do portfólio.
   * **Colunas:** `id`, `title`, `title_en`, `description`, `description_en`, `tech_stack`, `github_url`, `live_url`, `thumbnail`, `featured`, `status`, `created_at`.

3. **`settings`**
   * **Propósito:** Armazenar configurações da página no formato chave/valor.
   * **Colunas:** `setting_key`, `setting_value`.

4. **`skills`**
   * **Propósito:** Armazenar as habilidades exibidas no portfólio.
   * **Colunas:** `id`, `name`, `name_en`, `category`, `category_en`, `level`, `color`, `created_at`.

5. **`experiences`**
   * **Propósito:** Armazenar experiências profissionais e acadêmicas.
   * **Colunas:** `id`, `company`, `company_en`, `role`, `role_en`, `period`, `period_en`, `description`, `description_en`, `techs`, `type`, `order_index`, `created_at`.

O banco indicado por `DB_NAME` deve existir previamente. A partir da raiz, `npm run db:migrate` cria as tabelas ausentes e adiciona as colunas de tradução que ainda não existirem. Durante a inicialização da API, `backend/src/app.js` também verifica essas colunas, garante as tabelas `settings`, `skills` e `experiences` e insere dados iniciais bilíngues em `skills` e `experiences` quando elas estão vazias. Essa inicialização ocorre mesmo quando o Resend não está configurado.

---

## 3. Backend (`/backend`)

O backend foi construído sob o padrão arquitetural **MVC** (Model-View-Controller), sem a camada View, pois quem renderiza as visualizações é o Frontend.

### 3.1. Estrutura de Diretórios
* `src/app.js`: Ponto de entrada. Configura o Express (incluindo `trust proxy` para rate limiting atrás de proxy reverso), restringe o CORS, adiciona cabeçalhos de segurança, integra o `http.createServer` com o `Socket.IO` e registra as rotas da API. Um middleware injeta o servidor WebSocket (`req.io`) nas requisições.
* `src/database/connection.js`: Estabelece o pool de conexões com o MySQL por `mysql2/promise`. Conexões remotas utilizam TLS; quando `DB_SSL_CA_BASE64` é configurada, o certificado é validado por padrão. Sem a CA privada do provedor, a conexão mantém a criptografia em modo de compatibilidade, sem validação da cadeia.
* `src/models/`: Responsáveis pelas queries SQL e pelo acesso às tabelas.
  * `projectModel.js`, `userModel.js`, `settingsModel.js`, `skillsModel.js`, `experienceModel.js`.
* `src/database/migrate.js`: Cria as tabelas utilizadas pela aplicação quando elas ainda não existem.
* `src/controllers/`: Contêm as regras de negócio. Eles processam o corpo (body) da requisição, chamam os `models` adequados e disparam os eventos via `req.io.emit`.
* `src/routes/`: Mapeiam URLs e verbos HTTP (GET, POST, PUT, DELETE) para as funções específicas nos `controllers`.
* `src/middleware/authMiddleware.js`: Intercepta rotas privadas verificando a presença e a validade de um JSON Web Token (JWT).
* `src/middleware/rateLimiter.js`: Middleware que define limitadores de requisições (`express-rate-limit`) para proteger rotas contra spams e ataques de força bruta.
* `src/utils/security.js`: Funções reutilizáveis para validar e normalizar e-mail, senha, URLs e PDFs, além de escapar conteúdo HTML.
* `test/security.test.js` e `test/resumePairs.test.js`: Testes unitários das validações de segurança e da associação de currículos legados usando o test runner nativo do Node.js.

### 3.2. Fluxo de Autenticação (Login e Registro)
1. **Registro Administrativo:** A rota `POST /api/auth/register` exige `ADMIN_SETUP_KEY` na propriedade `setupKey` e aplica rate limiting. A criação usa um bloqueio exclusivo no MySQL, impedindo que requisições simultâneas ultrapassem o limite de um administrador; quando um usuário já existe, a API responde com `403 Forbidden`.
2. **Fluxo de Login:**
   * O cliente envia `email` e `password` para `POST /api/auth/login`.
   * O `authController` busca o usuário pelo e-mail no banco.
   * Se existir, usa o `bcrypt.compare` para bater a senha enviada em texto puro com o *hash* salvo.
   * Se válido, gera um token JWT em `HS256` (assinado via `JWT_SECRET`) válido por 8 horas e o retorna. A validação aceita explicitamente somente esse algoritmo.

### 3.3. WebSockets (Socket.IO)
* O servidor Node.js escuta eventos WebSocket na mesma porta da API.
* Sempre que há uma alteração de dados (criação/edição/remoção de Projetos ou alteração de Configurações), o controller executa `req.io.emit('refresh_data')`.

### 3.4. Recuperação de Senha (Forgot Password)
* O sistema possui um fluxo de recuperação integrado via E-mail utilizando a API do **Resend**.
* O `authController` devolve a mesma resposta exista ou não uma conta, reduzindo enumeração de usuários. Quando a conta existe, gera um token temporário vinculado à senha atual e envia um link baseado exclusivamente em `FRONTEND_URL`.
* Ao clicar no link, o Admin acessa a tela `/admin/reset` que consome a rota de validação e altera o *hash* da senha no banco de dados.
* A senha deve conter de 12 a 128 caracteres. Depois da troca, o token deixa de ser válido e não pode ser reutilizado.

### 3.5. Formulário de Contato e Rate Limiting
* Rota pública projetada para a página de contato do Frontend (`POST /api/contact`).
* Recebe Nome, Email e Mensagem e utiliza a API do **Resend** configurada no `.env` para enviar as mensagens diretamente para a caixa de entrada do desenvolvedor, validando os campos antes do envio.
* Os valores são limitados por tamanho e escapados antes de serem incorporados ao HTML do e-mail.
* **Proteção Anti-Abuso (Rate Limiting):** A API aplica um limite geral por IP. A rota de contato aceita no máximo 5 envios por hora; cadastro inicial, login e recuperação aceitam no máximo 10 tentativas a cada 15 minutos; as consultas ao GitHub possuem um limite adicional.

### 3.6. Monitoramento de Banco de Dados
* O `dbMonitor.js` vigia a disponibilidade do banco de dados na nuvem (Aiven) utilizando as próprias requisições de frontend dos visitantes (como a busca de projetos).
* Se a query falhar devido à queda do banco, ele registra o estado na memória do servidor e envia imediatamente um Alerta de Falha Crítica via **Resend** para o e-mail do dono.
* Mecanismo Anti-SPAM: e-mails de alerta não são repetidos caso vários visitantes acessem o site quebrado.
* Quando o banco for reativado e o primeiro visitante carregar o site com sucesso, o sistema enviará um e-mail informando que o banco de dados voltou à operação normal.

---

## 4. Frontend (`/frontend`)

O frontend é organizado em componentes, páginas, contexto e serviços, com Hooks do React para gerenciamento de estado e efeitos.

### 4.1. Estrutura de Diretórios
* `src/App.tsx`: A raiz da árvore de componentes. Ele encapsula o sistema de roteamento (`react-router-dom`) e conecta-se ao `Socket.IO` do servidor. Escuta o evento global `refresh_data` para forçar um recarregamento da página (`window.location.reload()`).
* `src/contexts/AuthContext.tsx` e `src/contexts/auth-context.ts`: Provider e contrato do estado de autenticação. O token JWT permanece no `localStorage`, é removido ao expirar e é enviado somente no header `Authorization` das operações administrativas.
* `src/contexts/LanguageContext.tsx`: Mantém o idioma `pt-BR` ou `en`, persiste a preferência no `localStorage` e atualiza o atributo `lang` do documento.
* `src/services/api.ts`: Centraliza requisições `fetch` para autenticação, projetos, GitHub, configurações, habilidades e experiências. A URL do backend é definida por `import.meta.env.VITE_API_URL`, com fallback local no código.
* `src/pages/`:
  * `Home.tsx`: A página inicial. Busca simultaneamente Projetos de Destaque, Repositórios e Contribuições do GitHub, e Status Dinâmicos das configurações.
  * `About.tsx`: Página Sobre com habilidades, experiências, formação e currículos dinâmicos. Os currículos são agrupados e ordenados por par, com as versões em português e inglês exibidas lado a lado.
  * `Projects.tsx`: Traz a lista exaustiva de todos os projetos cadastrados.
  * `Contact.tsx`: Apresenta o formulário interativo de contato.
  * `Admin.tsx`: Painel administrativo protegido por autenticação. Reúne o gerenciamento de projetos, habilidades, experiências, configurações e currículos. O cadastro de currículos envia obrigatoriamente um PDF em português e outro em inglês; os pares podem ser reordenados, editados e removidos.
  * `ResetPassword.tsx`: Tela que captura o token da URL enviado por e-mail e apresenta o formulário de nova senha.
* `src/components/Navbar.tsx`: Menu superior fixo para navegação, contendo o indicador dinâmico da versão atual do portfólio (pill badge verde-água).

### 4.2. Idiomas e currículos

* A interface pública possui textos em português do Brasil e inglês. As rotas permanecem as mesmas nos dois idiomas.
* Os textos editoriais em inglês da página inicial e da seção de currículos podem ser configurados no painel e são armazenados como chaves adicionais da tabela `settings`.
* Projetos, habilidades e experiências possuem campos com sufixo `_en`. A interface seleciona os campos correspondentes ao idioma ativo; novos cadastros exigem os dados principais nos dois idiomas.
* O cadastro de currículo exige simultaneamente um PDF em português do Brasil e outro em inglês. A API grava dois itens em `resumes_links`, vinculados pelo mesmo `pairId` e com a mesma posição em `order`.
* Cada item mantém `language` com os valores `pt-BR` ou `en`. Registros antigos sem `language`, `pairId` ou `order` continuam legíveis e são tratados como registros legados em português.
* No painel, um registro legado incompleto pode ser vinculado a outro PDF já cadastrado no idioma oposto. Se esse arquivo não existir, também é possível enviar somente o PDF ausente. Em ambos os casos, a API atribui `pairId` e `order` às duas versões sem substituir o arquivo original.
* A ordem é alterada no painel por par, e a página Sobre apresenta cada versão em português ao lado da respectiva versão em inglês.

### 4.3. Integração Externa e Controle de Versão (GitHub)
O backend atua como um proxy (intermediário) para o GitHub:
* O `githubController.js` utiliza um token de acesso para consultar as APIs GraphQL e REST do GitHub e preparar os dados de contribuições consumidos pelo frontend.
* As respostas bem-sucedidas ficam em cache na memória por cinco minutos e as rotas possuem rate limiting para reduzir consumo da cota do GitHub.
* As chamadas externas usam tempo limite. As descrições dos repositórios são mantidas no idioma original informado no GitHub e não são enviadas a um tradutor automático.
* **Exibição da Versão do Site:** O backend fornece a rota `/api/github/version`, que busca a última *release* do repositório do portfólio no GitHub (ou o SHA curto do último commit como fallback). A versão é exibida de forma global e estilizada no cabeçalho (`Navbar.tsx`) ao lado do logo "Dev".

### 4.4. Controles de segurança para publicação

* O backend aceita requisições com `Origin` apenas dos endereços locais, da URL pública confirmada e das origens configuradas em `FRONTEND_URL`.
* A API não expõe `X-Powered-By` e envia cabeçalhos contra interpretação incorreta de conteúdo, frames e acesso a sensores.
* A Vercel adiciona CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy` às respostas do frontend.
* Frontend e backend enviam HSTS em produção. A CSP restringe as conexões do frontend ao backend publicado configurado em `frontend/vercel.json`.
* O endpoint público de configurações utiliza uma lista permitida de chaves. Atualizações administrativas também rejeitam chaves desconhecidas, URLs fora de HTTP/HTTPS e valores excessivamente longos.
* Uploads de currículo aceitam somente dados identificados como PDF, com assinatura `%PDF-` e tamanho máximo de 5 MB por arquivo.

---

## 5. Fluxo Completo de uma Ação (Ex: Salvar Status Atual)

Para entender a ligação ponta-a-ponta, veja o ciclo de vida ao mudar o "Status Atual":
1. **Frontend:** O administrador acessa a tela `/admin` e escolhe "Trabalhando" no Dropdown. Ele clica em salvar. O React chama `updateSettings(token, settings)` em `api.ts`.
2. **Rede:** Uma requisição HTTP `PUT /api/settings` é enviada com um `Authorization: Bearer <token>`.
3. **Backend Middleware:** O `authMiddleware.js` intercepta a chamada, valida que o `<token>` é genuíno. A requisição é autorizada.
4. **Backend Controller:** O Express passa a requisição para `updateSettings` em `settingsController.js`.
5. **Backend Model:** O controller percorre as configurações enviadas e chama `settingsModel.updateSetting()`.
6. **Banco de dados:** O model executa uma query parametrizada `INSERT ... ON DUPLICATE KEY UPDATE` no MySQL.
7. **WebSockets (Notificação):** O controller avisa `req.io.emit('refresh_data')`.
8. **Frontend:** Os clientes com conexão Socket.IO ativa recebem `refresh_data`; o `App.tsx` executa `window.location.reload()` para carregar os dados atualizados.
