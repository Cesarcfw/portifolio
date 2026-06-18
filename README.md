# Portfólio Profissional - César

Este é um projeto completo de portfólio profissional (Full Stack), desenvolvido para exibir projetos, habilidades e permitir a comunicação direta através de um formulário de contato. Ele conta também com um painel de administrador protegido, de onde é possível atualizar os dados do portfólio em tempo real para todos os visitantes conectados.

## 🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando as seguintes tecnologias:

### Frontend
* **React** (via Vite)
* **TypeScript**
* **Tailwind CSS** (para estilização responsiva e moderna)
* **Socket.IO-Client** (para atualizações em tempo real)
* **React Router DOM** (para navegação)

### Backend
* **Node.js** com **Express**
* **MySQL** (banco de dados relacional)
* **Socket.IO** (WebSockets)
* **JWT (JSON Web Tokens)** e **Bcrypt** (para autenticação de administrador)
* **Nodemailer** (para envio de e-mails de recuperação de senha e formulário de contato)

## 📁 Estrutura do Projeto

O repositório está dividido em duas pastas principais, formando um monorepo simples:

* `/frontend` - Contém todo o código da interface visual e componentes React. Veja o [README do Frontend](./frontend/README.md).
* `/backend` - Contém o servidor Node.js, rotas da API e comunicação com o banco de dados. Veja o [README do Backend](./backend/README.md).

## ⚙️ Como executar o projeto localmente

Na pasta raiz do projeto, temos um pacote configurado com `concurrently` para rodar tanto o frontend quanto o backend simultaneamente com apenas um comando.

### Pré-requisitos
* **Node.js** instalado na sua máquina
* **MySQL** rodando localmente (ou em nuvem)

### Passo a passo

1. **Instale as dependências gerais:**
   Abra o terminal na pasta raiz do projeto e execute:
   ```bash
   npm run install:all
   ```
   *(Este comando instalará os pacotes da raiz, do backend e do frontend automaticamente).*

2. **Configure as Variáveis de Ambiente:**
   Navegue até a pasta `/backend` e crie um arquivo `.env` com base no que está descrito no README do backend. Certifique-se de preencher as credenciais do banco de dados, JWT e Nodemailer.

3. **Inicie o Servidor:**
   Volte para a pasta raiz do projeto e execute:
   ```bash
   npm run dev
   ```
   O terminal iniciará os dois serviços. O Frontend estará acessível geralmente em `http://localhost:5173` e o Backend na porta `3000`.

## 🔒 Painel de Administração

O sistema conta com uma rota de administração em `/admin`. Através dela você pode:
* Criar, editar e excluir projetos do portfólio.
* Atualizar o "Status de Disponibilidade" (ex: Trabalhando, Freelancer, Disponível).
* Qualquer alteração salva será refletida na tela de todos os usuários que estiverem com o site aberto graças ao Socket.IO.

*A senha de administrador pode ser redefinida via e-mail clicando na opção "Esqueci a senha" na própria tela de login do Admin.*
