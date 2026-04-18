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
   Para o banco manual de teste, use `.env.test` baseado no `.env.test.example`.
   Para testes E2E, use `.env.e2e` baseado no `.env.e2e.example`.
   Para produção, use `.env.prod.example` apenas como referência de valores; a aplicação carrega `.env` no runtime normal.
3. Suba a stack inteira (Banco + API) utilizando o Docker:
   ```bash
   docker-compose up -d --build
   ```
4. No fluxo atual do Docker Compose, a API sobe com este bootstrap:
   ```bash
   npm run migration:run
   npm run seed:dev
   npm run start:dev
   ```
   O `seed:dev` e idempotente: ele popula apenas banco vazio.
5. Se quiser popular a base manualmente fora do Docker, execute explicitamente:
   ```bash
   npm run seed:dev
   ```
   Se quiser limpar e recriar todo o dataset de desenvolvimento:
   ```bash
   npm run seed:dev:reset
   ```

A API estará rodando na porta definida no `.env` (por padrão `http://localhost:3001`).

**Acesse a documentação Swagger em:** `http://localhost:3001/api`

## Comandos Disponíveis

| Comando                                         | Descrição                                                                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run start:dev`                             | Inicia a aplicação com hot-reload ativo (ideal para desenvolvimento).                                                                                              |
| `npm run seed:dev`                              | Executa o seed de desenvolvimento apenas se o banco estiver vazio. No Docker Compose principal, ele ja faz parte do bootstrap da API.                              |
| `npm run seed:dev:reset`                        | Limpa os dados e recria o dataset de desenvolvimento de forma explícita.                                                                                           |
| `npm run build`                                 | Compila o projeto TypeScript para JavaScript de produção (pasta `/dist`).                                                                                          |
| `npm run test`                                  | Executa os testes unitários utilizando o Jest.                                                                                                                     |
| `docker-compose up -d postgres-test`            | Sobe apenas o banco manual de teste (`api_db_test`) quando você quiser usar a API com dados seedados fora da stack completa.                                       |
| `npm run test:e2e`                              | Executa os testes de integração (End-to-End) em um banco separado de E2E (`api_db_e2e`). A suíte aborta se o alvo for o mesmo `DB_DATABASE` do ambiente principal. |
| `npm run test:e2e:docker`                       | Sobe o `postgres-e2e` e executa os E2E em um runner efêmero da `api`, sem tocar no `api_db_test`.                                                                  |
| `npm run lint`                                  | Roda o ESLint no projeto para garantir os padrões de código e TypeScript.                                                                                          |
| `npm run format`                                | Roda o Prettier sobre o código para formatá-lo.                                                                                                                    |
| `docker-compose up -d`                          | Sobe a stack inteira. No bootstrap atual da API em Docker: aplica migrations, executa o seed de desenvolvimento em banco vazio e inicia o Nest em modo dev.        |
| `npm run migration:generate -- NomeDaMigration` | Gera uma nova migration, capturando e versionando as mudanças feitas nas suas classes `Entity`.                                                                    |
| `npm run migration:run`                         | Executa fisicamente todas as migrations pendentes no banco. **Obrigatório para validar schemas no Deploy Oficial de Produção.**                                    |
| `npm run migration:revert`                      | Reverte a última migration executada no banco de dados.                                                                                                            |

### Popular o banco de teste manualmente

Se voce quiser o mesmo dataset de desenvolvimento no `api_db_test`, sem mexer no fluxo padrao dos E2E:

```bash
npm run seed:test:dev
```

Para limpar e recriar esse dataset no banco de teste:

```bash
npm run seed:test:dev:reset
```

### Banco E2E separado

Os testes E2E automatizados agora usam um terceiro banco, separado do `api_db` e do `api_db_test`.

- banco principal: `api_db`
- banco manual de teste: `api_db_test`
- banco automatizado E2E: `api_db_e2e`

Para subir apenas o banco automatizado de E2E:

```bash
docker compose --profile e2e up -d postgres-e2e
```

Para rodar a suite E2E no fluxo dockerizado:

```bash
npm run test:e2e:docker
```

### Reset do banco de teste manual

Se o `postgres-test` ficar com volume antigo ou credenciais divergentes, recrie apenas a stack manual de teste:

```bash
docker compose stop postgres-test
docker compose rm -f postgres-test
docker volume rm hub-backend_pgdata_test
npm run bootstrap:test:dev
```

## Estrutura do Projeto

Para os detalhes arquiteturais, veja os arquivos README dentro de cada diretório do diretório `src/`.

- `src/core/`: Domínio, portas, exceções e regras de negócio.
- `src/adapters/`: Controladores, Repositórios ORM e implementações concretas das portas.

## Dataset real do seed

Quando a stack sobe com banco vazio via `docker compose up -d --build`, o seed de desenvolvimento atual cria:

- `1` admin
- `3` empresas
- `5` cursos
- `2` cursos presenciais
- `15` alunos
- `10` skills
- `2` curriculos
- `5` vagas

### Empresas de exemplo

| Email                     | Empresa                  | Responsavel     | CNPJ                 | Cidade         |
| ------------------------- | ------------------------ | --------------- | -------------------- | -------------- |
| `tech@innovatech.com`     | `InnovaTech Solucoes`    | `Carlos Mendes` | `12.345.678/0001-99` | `Porto Alegre` |
| `rh@solucoesdigitais.com` | `Solucoes Digitais Ltda` | `Fernanda Lima` | `98.765.432/0001-11` | `Canoas`       |
| `vagas@nextera.com`       | `Nextera Tecnologia`     | `Rafael Souza`  | `45.678.901/0001-55` | `Sao Leopoldo` |

### Cursos de exemplo

| Nome                             | Carga  | Inicio       | Fim          | Link                              |
| -------------------------------- | ------ | ------------ | ------------ | --------------------------------- |
| `Desenvolvimento Web Full Stack` | `120h` | `2025-02-01` | `2025-06-30` | `https://fatilab.com/cursos/web`  |
| `Ciencia de Dados com Python`    | `80h`  | `2025-03-01` | `2025-05-31` | `https://fatilab.com/cursos/data` |
| `UX/UI Design`                   | `60h`  | `2025-04-01` | `2025-05-31` | `https://fatilab.com/cursos/ux`   |

### Alunos de exemplo

| Email                 | Nome                | Cidade          | Escolaridade   | Area              |
| --------------------- | ------------------- | --------------- | -------------- | ----------------- |
| `aluno01@fatilab.com` | `Ana Beatriz Costa` | `Porto Alegre`  | `ensino_medio` | `design`          |
| `aluno02@fatilab.com` | `Bruno Ferreira`    | `Canoas`        | `superior`     | `desenvolvimento` |
| `aluno03@fatilab.com` | `Carla Souza`       | `Gravatai`      | `tecnico`      | `dados`           |
| `aluno04@fatilab.com` | `Diego Almeida`     | `Novo Hamburgo` | `ensino_medio` | `infraestrutura`  |

### Vagas de exemplo

| Vaga                       | Empresa                  | Vagas | PCD     |
| -------------------------- | ------------------------ | ----- | ------- |
| `Desenvolvedor Frontend`   | `InnovaTech Solucoes`    | `2`   | `true`  |
| `Analista de Dados`        | `InnovaTech Solucoes`    | `1`   | `false` |
| `Designer UX/UI`           | `Solucoes Digitais Ltda` | `3`   | `true`  |
| `Engenheiro DevOps`        | `Solucoes Digitais Ltda` | `1`   | `false` |
| `Desenvolvedor Full Stack` | `Nextera Tecnologia`     | `2`   | `true`  |

### Skills de exemplo

`JavaScript`, `TypeScript`, `Python`, `React`, `Node.js`, `SQL`, `Figma`, `Docker`, `Git`, `Excel`

### Consultas SQL uteis para conferir o seed

```sql
SELECT email, role
FROM users
ORDER BY role, email;

SELECT name, cnpj, responsible_name
FROM companies
ORDER BY name;

SELECT name, course_load, start_date, end_date
FROM courses
ORDER BY start_date;

SELECT name, openings_count, is_pcd
FROM job_openings
ORDER BY name;
```

## Credenciais documentadas

As credenciais abaixo só existirão se o seed de desenvolvimento tiver sido executado.

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
