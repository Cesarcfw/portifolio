# Política de segurança

## Versões suportadas

Este é um projeto de portfólio mantido em uma única linha de desenvolvimento. Correções de segurança são aplicadas somente à versão mais recente da branch principal.

## Como reportar uma vulnerabilidade

Não publique credenciais, dados pessoais, provas de conceito destrutivas ou detalhes que permitam explorar a aplicação em uma issue pública.

Quando o recurso estiver habilitado, utilize o reporte privado de vulnerabilidades disponível na aba **Security** do repositório. Caso ele não esteja disponível, solicite um canal privado ao mantenedor por meio do [perfil no GitHub](https://github.com/Cesarcfw), sem incluir inicialmente informações sensíveis.

O relatório deve conter, quando possível:

- componente ou endpoint afetado;
- impacto observado;
- passos mínimos e não destrutivos para reprodução;
- versão ou commit analisado;
- sugestão de correção, se houver.

O recebimento será confirmado assim que possível. A análise pode resultar em pedido de informações adicionais, correção no código, rotação de credenciais ou encerramento fundamentado quando o comportamento não representar uma vulnerabilidade.

## Testes responsáveis

Não realize testes de negação de serviço, engenharia social, acesso a dados de terceiros, alteração do banco publicado ou uso de credenciais sem autorização expressa. Testes devem se limitar ao mínimo necessário para demonstrar o problema com segurança.

## Segredos expostos

Se uma chave, senha ou token for identificado no repositório ou em um artefato publicado, não o reutilize nem o compartilhe. Informe apenas o local afetado pelo canal privado; o valor deverá ser revogado e substituído no provedor correspondente.
