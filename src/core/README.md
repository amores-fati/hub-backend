# Core
O diretório `core` é o coração da nossa aplicação. Ele contém todas as regras de negócio, casos de uso e a modelagem do nosso domínio. O conceito principal aqui é o **Isolamento**.

## Responsabilidades
A principal responsabilidade do Core é resolver o problema de negócio para o qual o software foi criado, sem saber como a aplicação é exposta para o usuário ou como os dados são salvos (PostgreSQL, MongoDB, etc.).

## Estrutura
- `/domain`: Modelos e entidades puras do negócio.
- `/exceptions`: Erros customizados da aplicação.
- `/ports`: Interfaces que definem contratos de entrada e saída.
- `/services`: Casos de uso da aplicação que orquestram o domínio.

## Boas Práticas
- Mantenha este diretório utilizando apenas TypeScript puro (ou bibliotecas utilitárias estritamente necessárias, como manipulação de datas).
- Pense no Core como um pacote NPM isolado. Se você pegar esta pasta e colocar em outro projeto TypeScript, ela deve funcionar sem quebrar.

## O que NÃO fazer
- **Nunca** importe nada do diretório `adapters`.
- **Nunca** utilize bibliotecas de banco de dados aqui (ex: TypeORM, Prisma).
- **Nunca** utilize bibliotecas de roteamento web (ex: Express, decorators de Controller do NestJS).