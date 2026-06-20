# Documentação Completa do Código - Portfólio Profissional

Este documento detalha a arquitetura, o fluxo de dados e a estrutura de diretórios do projeto de Portfólio Profissional. O sistema foi construído visando alta performance, segurança para administração e interatividade em tempo real.

---

## 1. Arquitetura Geral

O projeto adota uma arquitetura **Cliente-Servidor (Client-Server)** desacoplada:
* **Frontend (Cliente):** Um Single Page Application (SPA) em React (construído com Vite), utilizando TypeScript para tipagem estática e Tailwind CSS para estilização.
* **Backend (Servidor):** Uma API RESTful em Node.js com Express, que expõe endpoints para acesso aos dados e gerencia a lógica de negócios e segurança.
* **Banco de Dados:** MySQL, atuando como a fonte única de verdade (Single Source of Truth) para projetos, usuários e configurações do site.
* **Comunicação em Tempo Real:** Uma camada de WebSockets fornecida pelo `Socket.IO` permite comunicação bidirecional de baixa latência, mantendo a tela dos visitantes sempre atualizada.

---

## 2. Banco de Dados (MySQL)

A modelagem de dados foi dividida em três domínios centrais:

1. **`users`**
   * **Propósito:** Armazenar as credenciais do administrador.
   * **Colunas:** `id` (PK), `email` (UNIQUE), `password_hash` (senha protegida por bcrypt).
   
2. **`projects`**
   * **Propósito:** Armazenar os projetos do portfólio.
   * **Colunas:** `id` (PK), `title`, `description`, `tech_stack` (JSON ou String), `github_url`, `live_url`, `featured` (Boolean), `status` (String).

3. **`settings`**
   * **Propósito:** Estrutura flexível de Chave-Valor para as configurações da página (como os Status Dinâmicos).
   * **Colunas:** `setting_key` (PK), `setting_value`.

---

## 3. Backend (`/backend`)

O backend foi construído sob o padrão arquitetural **MVC** (Model-View-Controller), sem a camada View, pois quem renderiza as visualizações é o Frontend.

### 3.1. Estrutura de Diretórios
* `src/app.js`: Ponto de entrada. Configura o Express, CORS, integra o `http.createServer` com o `Socket.IO` e registra todas as rotas da API. Um middleware injeta o servidor WebSocket (`req.io`) em todas as requisições.
* `src/database/connection.js`: Estabelece o pool de conexões com o MySQL através do módulo `mysql2/promise`.
* `src/models/`: Responsáveis pelas queries SQL nativas. Isolam o acesso ao banco.
  * `projectModel.js`, `userModel.js`, `settingsModel.js`.
* `src/controllers/`: Contêm as regras de negócio. Eles processam o corpo (body) da requisição, chamam os `models` adequados e disparam os eventos via `req.io.emit`.
* `src/routes/`: Mapeiam URLs e verbos HTTP (GET, POST, PUT, DELETE) para as funções específicas nos `controllers`.
* `src/middleware/authMiddleware.js`: Intercepta rotas privadas verificando a presença e a validade de um JSON Web Token (JWT).

### 3.2. Fluxo de Autenticação (Login)
1. O cliente envia `email` e `password` para `POST /api/auth/login`.
2. O `authController` busca o usuário pelo e-mail no banco.
3. Se existir, usa o `bcrypt.compare` para bater a senha enviada em texto puro com o *hash* salvo.
4. Se válido, gera um token JWT (assinado via `JWT_SECRET`) válido por 8 horas e o retorna.

### 3.3. WebSockets (Socket.IO)
* O servidor Node.js escuta eventos WebSocket na mesma porta da API.
* Sempre que há uma alteração de dados (criação/edição/remoção de Projetos ou alteração de Configurações), o controller executa `req.io.emit('refresh_data')`.

### 3.4. Recuperação de Senha (Forgot Password)
* O sistema possui um fluxo de recuperação integrado via E-mail utilizando a API do **Resend**.
* O `authController` intercepta a requisição, gera um token temporário assinado e envia um link parametrizado para o e-mail do administrador, lendo a URL de origem automaticamente.
* Ao clicar no link, o Admin acessa a tela `/admin/reset` que consome a rota de validação e altera o *hash* da senha no banco de dados.

### 3.5. Formulário de Contato (`/api/contact`)
* Rota pública projetada para a página de contato do Frontend.
* Recebe Nome, Email e Mensagem e utiliza a API do **Resend** configurada no `.env` para enviar as mensagens diretamente para a caixa de entrada do desenvolvedor, validando os campos antes do envio.

### 3.6. Monitoramento de Banco de Dados (Heartbeat Inteligente)
* O `dbMonitor.js` vigia a disponibilidade do banco de dados na nuvem (Aiven) utilizando as próprias requisições de frontend dos visitantes (como a busca de projetos).
* Se a query falhar devido à queda do banco, ele registra o estado na memória do servidor e envia imediatamente um Alerta de Falha Crítica via **Resend** para o e-mail do dono.
* Mecanismo Anti-SPAM: e-mails de alerta não são repetidos caso vários visitantes acessem o site quebrado.
* Quando o banco for reativado e o primeiro visitante carregar o site com sucesso, o sistema enviará um e-mail informando que o banco de dados voltou à operação normal.

---

## 4. Frontend (`/frontend`)

O frontend é altamente componenteizado e usa Hooks nativos do React para lidar com estados de forma funcional e moderna.

### 4.1. Estrutura de Diretórios
* `src/App.tsx`: A raiz da árvore de componentes. Ele encapsula o sistema de roteamento (`react-router-dom`) e conecta-se ao `Socket.IO` do servidor. Escuta o evento global `refresh_data` para forçar um recarregamento da página (`window.location.reload()`).
* `src/contexts/AuthContext.tsx`: Gerenciador de estado global para a autenticação do Admin. Mantém o token JWT na memória local (e no `localStorage`) e expõe métodos `login` e `logout`. Protege a tela de `/admin`.
* `src/services/api.ts`: Camada centralizadora de requisições (`fetch`). Todas as chamadas (login, busca de projetos, conexão com Github, envio de configurações) estão modularizadas como funções assíncronas aqui. A URL do backend é injetada através da variável de ambiente inteligente `import.meta.env.VITE_API_URL`.
* `src/pages/`:
  * `Home.tsx`: A página inicial. Busca simultaneamente Projetos de Destaque, Repositórios e Contribuições do GitHub, e Status Dinâmicos das configurações.
  * `About.tsx`: Uma página de currículo/sobre que exibe um dicionário estruturado de hard-skills e uma linha do tempo profissional com as experiências da carreira.
  * `Projects.tsx`: Traz a lista exaustiva de todos os projetos cadastrados.
  * `Contact.tsx`: Apresenta o formulário interativo de contato e invoca a API do `Nodemailer`.
  * `Admin.tsx`: Um painel (dashboard) com duas interfaces. Se não autenticado, mostra o formulário de login e link de "Esqueci a senha". Se autenticado, mostra a tabela de edição de projetos (CRUD) e as configurações de status do perfil com seletores dropdown.
  * `ResetPassword.tsx`: Tela que captura o token da URL enviado por e-mail e apresenta o formulário de nova senha.
* `src/components/Navbar.tsx`: Menu superior fixo para navegação.

### 4.2. Integração Externa (GitHub)
O backend atua como um proxy (intermediário) para o GitHub:
* O `githubController.js` utiliza um Token de Acesso Pessoal para bater na API GraphQL e na API REST do GitHub, formatando os dados de dias e quantidade de commits para entregar perfeitamente mastigado para o frontend, que plota o *heatmap* dinâmico.

---

## 5. Fluxo Completo de uma Ação (Ex: Salvar Status Atual)

Para entender a ligação ponta-a-ponta, veja o ciclo de vida ao mudar o "Status Atual":
1. **Frontend:** O administrador acessa a tela `/admin` e escolhe "Trabalhando" no Dropdown. Ele clica em salvar. O React chama `updateSettings(token, settings)` em `api.ts`.
2. **Rede:** Uma requisição HTTP `PUT /api/settings` é enviada com um `Authorization: Bearer <token>`.
3. **Backend Middleware:** O `authMiddleware.js` intercepta a chamada, valida que o `<token>` é genuíno. A requisição é autorizada.
4. **Backend Controller:** O Express passa a requisição para `updateSettings` em `settingsController.js`.
5. **Backend Model:** O controller percorre as configurações enviadas e chama `settingsModel.updateSetting()`.
6. **Database:** Uma query `INSERT ... ON DUPLICATE KEY UPDATE` é injetada no MySQL com segurança (prevenindo SQL Injection).
7. **WebSockets (Notificação):** O controller avisa `req.io.emit('refresh_data')`.
8. **Frontend Ouve:** Todos os navegadores que estiverem na `Home.tsx` (ou no próprio `Admin`) que estão com socket ativo escutam o evento `refresh_data` dentro do `App.tsx` e invocam instantaneamente o comando de recarregamento. A tela pisca em questão de milisegundos exibindo o novo status.
