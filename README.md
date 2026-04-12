# Amores Fati - Backend

Esta é uma API NestJS estruturada estritamente seguindo os princípios de Arquitetura Hexagonal (Ports & Adapters), SOLID e Clean Code.

## Tecnologias Utilizadas

- **Framework:** NestJS (Node.js/TypeScript)
- **Database / ORM:** PostgreSQL + TypeORM
- **Qualidade de Código:** ESLint e Prettier
- **Documentação:** Swagger (OpenAPI)
- **Testes:** Jest, Supertest
- **DevSecOps/Infra:** Docker (Multi-stage build), Docker Compose, GitHub Actions

## Pré-requisitos

Para rodar este projeto, você precisará ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (v20+)
- [npm](https://www.npmjs.com/) (ou yarn/pnpm)
- [Docker e Docker Compose](https://www.docker.com/)

## Como Rodar a Aplicação

1. Clone o repositório e acesse a pasta do projeto.
2. Certifique-se de que o seu arquivo `.env` está preenchido (baseado no `.env.example`).
3. Suba a stack inteira (Banco + API) utilizando o Docker:
   ```bash
   docker-compose up -d --build
   ```

A API estará rodando na porta definida no `.env` (por padrão `http://localhost:3001`).

**Acesse a documentação Swagger em:** `http://localhost:3001/api`

## Comandos Disponíveis

| Comando                                         | Descrição                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `npm run start:dev`                             | Inicia a aplicação com hot-reload ativo (ideal para desenvolvimento).                                                           |
| `npm run build`                                 | Compila o projeto TypeScript para JavaScript de produção (pasta `/dist`).                                                       |
| `npm run test`                                  | Executa os testes unitários utilizando o Jest.                                                                                  |
| `docker-compose up -d postgres-test`            | Sobe o banco de dados dedicado para testes (`api_db_test`). Obrigatório rodar localmente antes dos testes E2E.                  |
| `npm run test:e2e`                              | Executa os testes de integração (End-to-End). Conecta-se automaticamente ao banco de testes graças ao `.env.test`.              |
| `npm run lint`                                  | Roda o ESLint no projeto para garantir os padrões de código e TypeScript.                                                       |
| `npm run format`                                | Roda o Prettier sobre o código para formatá-lo.                                                                                 |
| `docker-compose up -d`                          | Sobe a stack inteira (banco Postgres e imagem final da API no Docker).                                                          |
| `npm run migration:generate -- NomeDaMigration` | Gera uma nova migration, capturando e versionando as mudanças feitas nas suas classes `Entity`.                                 |
| `npm run migration:run`                         | Executa fisicamente todas as migrations pendentes no banco. **Obrigatório para validar schemas no Deploy Oficial de Produção.** |
| `npm run migration:revert`                      | Reverte a última migration executada no banco de dados.                                                                         |

## Estrutura do Projeto

Para os detalhes arquiteturais, veja os arquivos README dentro de cada diretório do diretório `src/`.

- `src/core/`: Domínio, portas, exceções e regras de negócio.
- `src/adapters/`: Controladores, Repositórios ORM e implementações concretas das portas.

## Credenciais documentadas

```
ADMIN
- Admin:        email: admin@fatilab.com         | senha: Admin@123

EMPRESAS
- Empresa 1:    email: tech@innovatech.com       | senha: Empresa@123
- Empresa 2:    email: rh@solucoesdigitais.com   | senha: Empresa@123
- Empresa 3:    email: vagas@nextera.com         | senha: Empresa@123

ALUNOS
- Aluno 1:      email: aluno01@fatilab.com       | senha: Aluno@123
- Aluno 2:      email: aluno02@fatilab.com       | senha: Aluno@123
- Aluno 3:      email: aluno03@fatilab.com       | senha: Aluno@123
- Aluno 4:      email: aluno04@fatilab.com       | senha: Aluno@123
- Aluno 5:      email: aluno05@fatilab.com       | senha: Aluno@123
- Aluno 6:      email: aluno06@fatilab.com       | senha: Aluno@123
- Aluno 7:      email: aluno07@fatilab.com       | senha: Aluno@123
- Aluno 8:      email: aluno08@fatilab.com       | senha: Aluno@123
- Aluno 9:      email: aluno09@fatilab.com       | senha: Aluno@123
- Aluno 10:     email: aluno10@fatilab.com       | senha: Aluno@123
- Aluno 11:     email: aluno11@fatilab.com       | senha: Aluno@123
- Aluno 12:     email: aluno12@fatilab.com       | senha: Aluno@123
- Aluno 13:     email: aluno13@fatilab.com       | senha: Aluno@123
- Aluno 14:     email: aluno14@fatilab.com       | senha: Aluno@123
- Aluno 15:     email: aluno15@fatilab.com       | senha: Aluno@123
```

