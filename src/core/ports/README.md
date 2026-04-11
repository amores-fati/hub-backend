# Ports (Portas / Interfaces)

As portas são o "P" da Arquitetura Ports & Adapters. Elas são interfaces TypeScript que definem os contratos de comunicação entre o Core e o mundo exterior.

## Responsabilidades

- **Inbound Ports (Portas de Entrada):** Definem como a aplicação externa pode usar o nosso Core (geralmente mapeadas nas assinaturas dos `services`).
- **Outbound Ports (Portas de Saída):** Definem o que o Core precisa do mundo exterior para funcionar (ex: salvar no banco, enviar um email).

## Boas Práticas

- Nomeie as portas de saída baseando-se no que elas representam para o domínio (ex: `IUserRepository`, `IEmailService`).
- Elas devem receber e retornar apenas tipos primitivos ou entidades do nosso `domain`.

## O que NÃO fazer

- Evite vazar detalhes de infraestrutura. Uma porta não deve se chamar `IPostgresUserRepository` ou depender de tipos do Express. O Core apenas diz "Preciso de um repositório de usuários", sem se importar com a tecnologia.
