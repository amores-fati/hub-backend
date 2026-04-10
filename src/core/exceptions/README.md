# Exceptions (Exceções de Domínio)

Este diretório contém classes de erro personalizadas que mapeiam falhas conhecidas das nossas regras de negócio.

## Responsabilidades

Fornecer clareza sobre o que deu errado dentro do `core`, sem depender de erros genéricos ou exceções HTTP de frameworks.

## Boas Práticas

- Crie classes descritivas que estendam a classe `Error` nativa do TypeScript.
- Utilize nomenclaturas baseadas no negócio, como `UserNotFoundError` ou `InsufficientFundsError`.

## O que NÃO fazer

- **Exceções de Framework:** Não lance erros específicos do NestJS (como `HttpException` ou `NotFoundException`) dentro do Core. Deixe para os `adapters/in` capturarem seus erros de domínio e traduzi-los para códigos HTTP.
