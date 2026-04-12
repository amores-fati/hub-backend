# Adapters In (Adaptadores de Entrada / Driving)

Os adaptadores de entrada "dirigem" a aplicação. Eles recebem as requisições de clientes externos (um frontend, outro microsserviço ou um terminal) e disparam os Casos de Uso (`services`).

## Responsabilidades

- **Roteamento:** Definir rotas da API (Controllers).
- **Validação de Input:** Garantir que o payload recebido está no formato correto (DTOs).
- **Tradução:** Chamar o `core/services` e converter a resposta do domínio em um formato adequado para o cliente (ex: JSON com o status HTTP correto).

## Estrutura

- `/controllers`: Implementações dos pontos de entrada HTTP utilizando decorators do NestJS.
- `/dtos`: Data Transfer Objects para entrada de dados (validação) e saída de dados (formatação).

## Boas Práticas

- Utilize DTOs (Data Transfer Objects) e validadores (como `class-validator`) para blindar a aplicação contra dados malformados antes mesmo de chegarem ao Core.
- Capture os erros de domínio (lançados no `core/exceptions`) e traduza-os para códigos de status HTTP semânticos (ex: traduzir `UserNotFoundError` para um HTTP 404).

## O que NÃO fazer

- **Zero Regras de Negócio:** Se você está escrevendo regras como `if (user.age > 18)` dentro de um Controller, você está quebrando a arquitetura. Mova isso para os `services` ou para o `domain`.
