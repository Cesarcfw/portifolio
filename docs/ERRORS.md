# Catálogo de erros da API

As respostas de erro da API contêm `code` (identificador estável) e `error` (mensagem para exibição). Exemplo:

```json
{"code":"GITHUB_AUTH_FAILED","error":"Integração com GitHub indisponível"}
```

O status HTTP continua indicando a categoria da falha. Os códigos são definidos em `backend/src/utils/apiErrors.js`. Não use o texto de `error` como identificador no frontend: ele pode mudar sem alterar o significado do código.

## Códigos

| Código | Significado | Ação de diagnóstico |
| --- | --- | --- |
| `INVALID_INPUT` | Dados de entrada inválidos. | Verificar os campos enviados. |
| `INVALID_JSON` | Corpo JSON malformado. | Verificar a requisição. |
| `PAYLOAD_TOO_LARGE` | Corpo acima do limite da API. | Reduzir o tamanho do envio. |
| `NOT_FOUND` | Rota ou recurso inexistente. | Conferir a rota ou o ID. |
| `RATE_LIMITED` | Limite local de requisições atingido. | Aguardar a janela indicada pelo limite. |
| `AUTH_INVALID_CREDENTIALS` | Login inválido. | Conferir as credenciais. |
| `AUTH_TOKEN_INVALID` | JWT ausente ou inválido. | Autenticar novamente. |
| `AUTH_TOKEN_EXPIRED` | JWT expirado. | Autenticar novamente. |
| `ADMIN_SETUP_DENIED` | Configuração inicial não autorizada. | Conferir o processo de configuração inicial. |
| `PASSWORD_RESET_INVALID` | Link de redefinição inválido, expirado ou já usado. | Solicitar um novo link. |
| `DATABASE_UNAVAILABLE` | Falha de conexão ou autenticação com MySQL. | Verificar disponibilidade e configuração do banco. |
| `DATABASE_QUERY_FAILED` | Falha em consulta ou gravação no banco. | Verificar logs do backend e esquema do banco. |
| `GITHUB_NOT_CONFIGURED` | Usuário ou token do GitHub ausente. | Verificar `GITHUB_USERNAME` e `GITHUB_TOKEN` no backend. |
| `GITHUB_AUTH_FAILED` | GitHub rejeitou a autenticação (HTTP 401). | Verificar a validade do token no Render. |
| `GITHUB_FORBIDDEN` | GitHub negou a operação (HTTP 403 sem indicação de limite). | Verificar permissões do token e regras do repositório. |
| `GITHUB_BRANCH_PROTECTED` | A regra da branch exige Pull Request para alterar o PDF. | Revisar a regra da `main` e o fluxo de upload. |
| `GITHUB_FILE_CONFLICT` | O arquivo mudou durante a gravação (HTTP 409). | Atualizar o painel e tentar novamente. |
| `GITHUB_RATE_LIMITED` | Limite da API do GitHub atingido. | Consultar a cota do token e aguardar a renovação. |
| `GITHUB_TIMEOUT` | GitHub não respondeu dentro do tempo limite. | Tentar novamente e consultar o estado do serviço. |
| `GITHUB_UPSTREAM_ERROR` | Falha ou resposta inesperada do GitHub. | Verificar `upstreamStatus` nos logs do Render. |
| `RESUME_INVALID_PDF` | PDF inválido ou acima de 5 MB. | Conferir o arquivo enviado. |
| `RESUME_NOT_FOUND` | Currículo não consta dos metadados. | Atualizar a listagem e conferir o registro. |
| `RESUME_FILE_NOT_FOUND` | PDF esperado não existe no caminho do GitHub. | Conferir o arquivo na branch `main`. |
| `RESUME_PAIR_INVALID` | Pareamento ou ordenação inválida. | Conferir os dois idiomas e a ordem enviada. |
| `RESUME_PAIR_CONFLICT` | Currículo já pertence a um par completo. | Selecionar outro currículo. |
| `RESUME_UPLOAD_FAILED` | Falha ao gravar PDF no GitHub. | Verificar `upstreamStatus` e permissões de Contents. |
| `EMAIL_NOT_CONFIGURED` | Serviço de e-mail sem configuração. | Verificar as variáveis de ambiente do Resend. |
| `EMAIL_DELIVERY_FAILED` | Resend não concluiu o envio. | Verificar os logs e o painel do Resend. |
| `INTERNAL_ERROR` | Falha inesperada. | Verificar os logs do backend. |

## Logs e segurança

Para falhas HTTP 5xx e conflitos de gravação no GitHub, o backend escreve um registro `api_error` no console do serviço. No Render, abra o serviço do backend e consulte **Logs**. O registro contém código, status, método, rota, status do GitHub quando disponível e tipo/código da exceção. Ele não inclui token, senha, corpo da requisição ou URL completa.

Exemplo de diagnóstico: se o navegador receber `GITHUB_AUTH_FAILED`, procure `"code":"GITHUB_AUTH_FAILED"` nos logs e confira `upstreamStatus`. O token deve ser corrigido no ambiente do backend; nunca o envie para o frontend nem o registre no log.

O frontend trata falha de rede como `NETWORK_ERROR` e resposta que não seja JSON como `API_INVALID_RESPONSE`; esses códigos não vêm da API. A rota de recuperação de senha preserva uma resposta pública genérica para não revelar se um e-mail está cadastrado. A rota de versão do portfólio usa um valor de fallback quando não consegue consultar o GitHub.
