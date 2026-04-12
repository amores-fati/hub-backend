# Utils
 
Este diretório contém utilitários compartilhados, decorators customizados, guards de segurança e estratégias de autenticação que dão suporte à infraestrutura do NestJS.
 
## Estrutura
 
- `/decorators`: Decorators customizados do NestJS (ex: `@CurrentUser`, `@ApiAuth`).
- `/guards`: Guards para proteção de rotas (ex: `JwtAuthGuard`).
- `/strategies`: Estratégias do Passport para autenticação (ex: `JwtStrategy`).
- `/validators`: Validadores customizados para o `class-validator` (ex: `IsCnpj`).
 
## Boas Práticas
 
- Mantenha funções utilitárias puras e genéricas.
- Se uma lógica de segurança começar a ficar complexa demais, avalie se ela não deveria estar no `core`.
