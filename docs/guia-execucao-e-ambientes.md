# Guia de Execucao e Ambientes

## Objetivo

Este documento descreve, com base apenas no codigo atual do repositorio, como:

- instalar o necessario para rodar o projeto
- entender o papel de cada arquivo `.env`
- subir a API e o banco com Docker
- rodar a API na maquina usando o banco em container
- diferenciar o banco principal do banco de teste
- executar migrations, seed e testes E2E sem misturar os bancos

## Fontes auditadas

Este guia foi montado a partir destes arquivos:

- `package.json`
- `.env`
- `.env.test`
- `.env.prod.example`
- `docker-compose.yml`
- `docker-compose.feature.yml`
- `Dockerfile`
- `src/config/database.config.ts`
- `src/config/typeorm.datasource.ts`
- `src/app.module.ts`
- `test/integration/bootstrap.ts`
- `src/adapters/out/seeds/seed.ts`

## Visao geral rapida

| Item                | Papel no projeto                                      | Arquivo fonte        |
| ------------------- | ----------------------------------------------------- | -------------------- |
| `.env`              | ambiente principal de desenvolvimento                 | `.env`               |
| `.env.test`         | ambiente do banco manual de teste                     | `.env.test`          |
| `.env.e2e`          | ambiente isolado dos testes E2E automatizados         | `.env.e2e`           |
| `.env.prod.example` | referencia de producao, nao carregada automaticamente | `.env.prod.example`  |
| `postgres`          | banco principal da stack local                        | `docker-compose.yml` |
| `postgres-test`     | banco manual de teste com seed                        | `docker-compose.yml` |
| `postgres-e2e`      | banco isolado para automacao E2E                      | `docker-compose.yml` |
| `api`               | container da API em desenvolvimento                   | `docker-compose.yml` |

## Pre-requisitos

Pelo que esta definido no projeto hoje, voce precisa ter:

1. `Node.js` 20 ou superior
2. `npm`
3. `Docker Desktop` ou Docker Engine com Compose

Observacao pratica para Windows + PowerShell:

- se `npm` falhar por causa de `npm.ps1`, use `npm.cmd`
- isso vale para comandos como `npm.cmd install`, `npm.cmd run start:dev` e `npm.cmd run test`

## Comandos equivalentes por shell

| Acao                  | PowerShell                       | Git Bash                       |
| --------------------- | -------------------------------- | ------------------------------ |
| instalar dependencias | `npm.cmd install` ou `npm.cmd i` | `npm install` ou `npm i`       |
| subir stack principal | `docker compose up -d --build`   | `docker compose up -d --build` |
| verificar containers  | `docker compose ps`              | `docker compose ps`            |
| rodar seed manual     | `npm.cmd run seed:dev`           | `npm run seed:dev`             |
| rodar seed no teste   | `npm.cmd run seed:test:dev`      | `npm run seed:test:dev`        |
| iniciar API local     | `npm.cmd run start:dev`          | `npm run start:dev`            |
| rodar E2E             | `npm.cmd run test:e2e`           | `npm run test:e2e`             |
| derrubar stack        | `docker compose down`            | `docker compose down`          |

## Arquivos de ambiente

### `.env`

E o arquivo principal de desenvolvimento.

Ele e carregado quando `NODE_ENV` nao e `test`, tanto:

- pelo `ConfigModule` do Nest em `src/app.module.ts`
- quanto pelo `DataSource` da CLI em `src/config/typeorm.datasource.ts`

Variaveis principais hoje:

- `PORT=3001`
- `DB_HOST=localhost`
- `DB_PORT=5434`
- `DB_DATABASE=api_db`
- `DB_TEST_HOST=localhost`
- `DB_TEST_PORT=5433`
- `DB_TEST_DATABASE=api_db_test`

Ponto importante:

- quando a API roda na sua maquina, ela usa `localhost:5434` para falar com o banco principal
- quando a API roda no container `api`, o `docker-compose.yml` sobrescreve `DB_HOST=postgres` e `DB_PORT=5432`

Ou seja: o mesmo `.env` serve para os dois cenarios porque o Compose injeta os overrides corretos dentro do container.

### `.env.test`

E o arquivo do banco manual de teste.

Ele e usado pelo seed explicito do banco manual de teste.

Hoje ele aponta para:

- `DB_HOST=127.0.0.1`
- `DB_PORT=5433`
- `DB_DATABASE=api_db_test`

### `.env.e2e`

E o arquivo do banco automatizado de E2E.

Ele e lido pelo bootstrap de `test/integration/bootstrap.ts`.

Hoje ele aponta para:

- `DB_HOST=127.0.0.1`
- `DB_PORT=5436`
- `DB_DATABASE=api_db_e2e`

### `.env.prod.example`

E apenas referencia.

O proprio arquivo deixa claro que:

- ele nao e carregado automaticamente
- em producao, os valores precisam ser injetados pela plataforma ou copiados para `.env`

## Diferenca entre banco principal, banco manual de teste e banco E2E

Essa separacao e obrigatoria neste projeto.

### Banco principal

- servico Docker: `postgres`
- porta exposta na maquina: `5434`
- nome padrao do banco: `api_db`
- usado pela API quando voce sobe a stack normal
- usado por `migration:run` e `seed:dev`

### Banco manual de teste

- servico Docker: `postgres-test`
- porta exposta na maquina: `5433`
- nome padrao do banco: `api_db_test`
- usado para validacao manual e testes exploratorios
- sobe junto no `docker compose up`
- recebe migrations e seed automaticamente no bootstrap da API

### Banco E2E

- servico Docker: `postgres-e2e`
- porta exposta na maquina: `5436`
- nome padrao do banco: `api_db_e2e`
- usado apenas pelos testes E2E automatizados
- preparado automaticamente pelo bootstrap de `test/integration/bootstrap.ts`

### Por que eles nao podem ser o mesmo banco

O bootstrap de testes E2E faz estas etapas:

1. carrega `.env` e `.env.e2e`
2. troca o ambiente para `NODE_ENV=test`
3. aponta `DB_HOST` e `DB_PORT` para os valores do banco E2E
4. executa as migrations
5. faz `TRUNCATE ... RESTART IDENTITY CASCADE` em todas as tabelas mapeadas

Por isso ele bloqueia explicitamente dois cenarios perigosos:

- quando `DB_DATABASE` do teste e igual ao banco principal
- quando o nome do banco alvo nem parece ser um banco de teste

## Passo a passo para rodar tudo com Docker

Este e o fluxo mais direto para desenvolvimento.

### 1. Instale as dependencias Node

```powershell
npm.cmd install
```

### 2. Revise o `.env`

Confirme principalmente:

- `PORT=3001`
- `DB_DATABASE=api_db`
- `DB_PORT=5434`
- `DB_TEST_DATABASE=api_db_test`
- `DB_TEST_PORT=5433`

### 3. Suba a stack principal

```powershell
docker compose up -d --build
```

O que esse comando sobe:

- `postgres`
- `postgres-test`
- `api`

O que a API faz ao iniciar:

1. executa `npm run migration:run`
2. executa `npm run seed:dev`
3. executa `npm run bootstrap:test:dev`
4. depois executa `npm run start:dev`

Isso vem do script `start:docker:dev` no `package.json`.

### 4. Verifique se os containers ficaram saudaveis

```powershell
docker compose ps
```

### 5. Acesse a aplicacao

- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/api`
- Postgres principal na maquina: `localhost:5434`

## Passo a passo para rodar a API na maquina e o banco no Docker

Esse fluxo e util quando voce quer depurar o Nest diretamente fora do container.

### 1. Suba apenas o banco principal

```powershell
docker compose up -d postgres
```

### 2. Aplique as migrations

Opcao padrao do projeto:

```powershell
npm.cmd run migration:run
```

Se o ambiente Windows tiver problema com o wrapper do TypeORM, use a alternativa direta:

```powershell
node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:run
```

### 3. Inicie a API em modo dev

```powershell
npm.cmd run start:dev
```

Nesse fluxo a API usa exatamente o que esta em `.env`:

- `DB_HOST=localhost`
- `DB_PORT=5434`

## Seed de desenvolvimento

O seed fica em `src/adapters/out/seeds/seed.ts`.

Ele roda automaticamente quando voce sobe a stack principal ou a stack feature via Docker Compose.

Fora do Docker Compose, o seed continua sendo uma etapa manual.

### Seed nao destrutivo

```powershell
npm.cmd run seed:dev
```

Comportamento real:

- conta registros em `users`
- se o banco ja tiver dados, cancela a execucao
- so popula um banco vazio

### Seed destrutivo

```powershell
npm.cmd run seed:dev:reset
```

Comportamento real:

- faz `TRUNCATE ... RESTART IDENTITY CASCADE`
- apaga e recria os dados de desenvolvimento

Use isso apenas no banco principal de desenvolvimento, nunca no banco de teste compartilhado com outra rotina.

## Exemplos reais do dataset de desenvolvimento

Quando o banco esta vazio e o seed roda com sucesso, ele cria:

- `1` admin
- `3` empresas
- `5` cursos
- `2` cursos presenciais
- `15` alunos
- `10` skills
- `2` curriculos
- `5` vagas

### Empresas reais do seed

| Email                     | Empresa                  | Responsavel     | Cidade         |
| ------------------------- | ------------------------ | --------------- | -------------- |
| `tech@innovatech.com`     | `InnovaTech Solucoes`    | `Carlos Mendes` | `Porto Alegre` |
| `rh@solucoesdigitais.com` | `Solucoes Digitais Ltda` | `Fernanda Lima` | `Canoas`       |
| `vagas@nextera.com`       | `Nextera Tecnologia`     | `Rafael Souza`  | `Sao Leopoldo` |

### Cursos reais do seed

| Curso                            | Carga  | Inicio       | Link                                |
| -------------------------------- | ------ | ------------ | ----------------------------------- |
| `Desenvolvimento Web Full Stack` | `120h` | `2025-02-01` | `https://fatilab.com/cursos/web`    |
| `Ciencia de Dados com Python`    | `80h`  | `2025-03-01` | `https://fatilab.com/cursos/data`   |
| `Infraestrutura e DevOps`        | `100h` | `2025-05-01` | `https://fatilab.com/cursos/devops` |

### Alunos reais do seed

| Email                 | Nome                | Escolaridade   | Area              |
| --------------------- | ------------------- | -------------- | ----------------- |
| `aluno01@fatilab.com` | `Ana Beatriz Costa` | `ensino_medio` | `design`          |
| `aluno02@fatilab.com` | `Bruno Ferreira`    | `superior`     | `desenvolvimento` |
| `aluno03@fatilab.com` | `Carla Souza`       | `tecnico`      | `dados`           |

### Vagas reais do seed

| Vaga                       | Empresa                  | Quantidade | PCD    |
| -------------------------- | ------------------------ | ---------- | ------ |
| `Desenvolvedor Frontend`   | `InnovaTech Solucoes`    | `2`        | `true` |
| `Designer UX/UI`           | `Solucoes Digitais Ltda` | `3`        | `true` |
| `Desenvolvedor Full Stack` | `Nextera Tecnologia`     | `2`        | `true` |

### SQL de verificacao

```sql
SELECT email, role
FROM users
ORDER BY role, email;

SELECT name, cnpj, responsible_name
FROM companies
ORDER BY name;

SELECT name, openings_count, is_pcd
FROM job_openings
ORDER BY name;
```

## Como rodar os testes E2E

## Opcao 1: fluxo manual

### 1. Suba o banco E2E

```powershell
docker compose --profile e2e up -d postgres-e2e
```

### 2. Confirme o `.env.e2e`

Hoje o esperado e:

- `DB_HOST=127.0.0.1`
- `DB_PORT=5436`
- `DB_DATABASE=api_db_e2e`

### 3. Rode a suite

```powershell
npm.cmd run test:e2e
```

O bootstrap dos testes:

- aplica migrations no banco E2E
- limpa os dados
- opcionalmente executa seed customizado do teste

## Como popular o banco de teste manualmente

Por padrao, o fluxo E2E nao usa o dataset de desenvolvimento.

Se voce quiser dados de QA manual no `api_db_test`, use:

```powershell
npm.cmd run seed:test:dev
```

Para apagar e recriar o dataset no banco de teste:

```powershell
npm.cmd run seed:test:dev:reset
```

Esses comandos apontam para `.env.test`, nao alteram o fluxo do `test:e2e` e nao mudam o comportamento do `docker compose up` padrao.

## Opcao 2: fluxo Dockerizado

```powershell
npm.cmd run test:e2e:docker
```

Esse script:

1. sobe `postgres-e2e`
2. executa um container efemero da `api`
3. injeta variaveis para forcar o alvo em `postgres-e2e:5432`
4. roda `npm run test:e2e`

Esse fluxo e o mais seguro quando voce quer garantir isolamento completo do teste.

## Reset do banco de teste

Quando o volume do banco de teste estiver velho, corrompido ou com credenciais divergentes:

```powershell
docker compose stop postgres-test
docker compose rm -f postgres-test
docker volume rm hub-backend_pgdata_test
```

Depois suba de novo com:

```powershell
npm.cmd run test:e2e:docker
```

## Ambiente isolado para mudancas de banco

O repositorio tambem possui `docker-compose.feature.yml`.

Ele sobe:

- `api-feature`
- `postgres-feature`

Portas atuais:

- API feature: `3004`
- Postgres feature: `5435`
- banco: `api_db_feature`

Subida:

```powershell
docker compose -f docker-compose.feature.yml -p hub-backend-feature up -d --build
```

Esse ambiente e util quando voce quer validar mudancas de schema sem tocar na stack principal.

## Checklist rapido de operacao

### Desenvolvimento normal com tudo em Docker

1. `npm.cmd install`
2. revisar `.env`
3. `docker compose up -d --build`
4. abrir `http://localhost:3001/api`

### Desenvolvimento com API fora do Docker

1. `npm.cmd install`
2. `docker compose up -d postgres`
3. `npm.cmd run migration:run`
4. `npm.cmd run start:dev`

### Testes E2E

1. revisar `.env.e2e`
2. `docker compose --profile e2e up -d postgres-e2e`
3. `npm.cmd run test:e2e`

## Observacoes finais

- `synchronize` esta desligado em `src/config/database.config.ts`; o schema evolui por migration
- o banco principal e o banco de teste precisam continuar separados
- `.env.prod.example` e apenas referencia; o runtime normal carrega `.env`
- se voce alterar estrutura de tabela, veja tambem `docs/guia-mudancas-no-banco.md`
