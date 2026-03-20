# Services (Casos de Uso)

Os `services` (ou Use Cases) orquestram o fluxo de uma regra de negócio específica. Eles são os maestros da aplicação.

## Responsabilidades
- Receber uma requisição de entrada, validar através do domínio, chamar as portas de saída necessárias (repositórios) e retornar uma resposta.
- Representar as ações que o sistema pode realizar (ex: `CreateUserService`, `AuthenticateUserService`).

## Boas Práticas
- Siga o Princípio de Responsabilidade Única (SRP). É preferível ter várias classes pequenas (ex: `CreateUser`, `UpdateUser`) do que uma classe gigante (`UserService`) com dezenas de métodos.
- Injete as dependências através do construtor utilizando as interfaces definidas no diretório `ports`.

## O que NÃO fazer
- Não coloque a lógica de validação de formato de dados aqui (ex: verificar se um e-mail é válido via Regex). Isso pertence aos DTOs nos adapters.
- Não retorne respostas HTTP (como objetos `Response` do Express/NestJS). Retorne entidades ou objetos puros e deixe o Controller lidar com o HTTP.