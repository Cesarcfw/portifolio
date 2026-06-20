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
* **Resend** (para envio de e-mails, formulário de contato e monitoramento do sistema)

## 📁 Estrutura do Projeto

O repositório está dividido em duas pastas principais, formando um monorepo simples:

* `/frontend` - Contém o código da interface visual e componentes React. Veja o [README do Frontend](./frontend/README.md).
* `/backend` - Contém o servidor Node.js, rotas da API e comunicação com o banco de dados. Veja o [README do Backend](./backend/README.md).

## ☁️ Arquitetura na Nuvem (Produção)

Este projeto foi estruturado para ser implantado na nuvem:
* **Frontend:** Preparado para deploy rápido na **Vercel**.
* **Backend:** Preparado para deploy na plataforma **Render**, incluindo rotinas inteligentes para acordar a API da hibernação e um "Heartbeat Monitor" ativo que utiliza o tráfego do site para avisar ao administrador sobre quedas no banco de dados.
* **Banco de Dados:** Hospedado no **Aiven** (MySQL).

## ⚙️ Como executar localmente

Na pasta raiz do projeto, temos um pacote configurado com `concurrently` para rodar tanto o frontend quanto o backend simultaneamente com apenas um comando.

### Passo a passo

1. **Instale as dependências gerais:**
   Abra o terminal na pasta raiz e execute:
   ```bash
   npm run install:all
   ```

2. **Configure as Variáveis de Ambiente:**
   Navegue até a pasta `/backend` e crie um arquivo `.env` (veja o README do backend). O frontend precisa de um `.env.local` contendo a variável `VITE_API_URL` apontando para o seu backend.

3. **Inicie o Servidor:**
   Volte para a pasta raiz e execute:
   ```bash
   npm run dev
   ```

## 🔒 Painel de Administração

O sistema conta com uma rota de administração em `/admin`. Através dela você pode:
* Criar, editar e excluir projetos do portfólio.
* Atualizar o "Status Atual" e "Disponibilidade" que são exibidos na Home em tempo real graças ao Socket.IO.
* A senha pode ser redefinida via e-mail diretamente pela tela de login do Admin.
