# Guia de Execucao e Ambientes

## Objetivo

Este guia descreve o fluxo atual do repositorio para:

- instalar o necessario
- entender o papel de cada `.env`
- subir a API e os bancos
- rodar a API local com Postgres em container
- executar seeds e migrations
- rodar os testes E2E sem misturar os bancos

## Fontes auditadas

- `package.json`
- `.env`
- `.env.test`
- `.env.e2e`
- `docker-compose.yml`
- `Dockerfile`
- `src/app.module.ts`
- `src/config/database.config.ts`
- `src/config/typeorm.datasource.ts`
- `test/integration/bootstrap.ts`
- `src/adapters/out/seeds/seed.ts`

## Visao geral

| Item | Papel |
| --- | --- |
| `.env` | ambiente principal de desenvolvimento |
| `.env.test` | banco manual de teste |
| `.env.e2e` | banco automatizado de E2E |
| `postgres` | banco principal da stack local |
| `postgres-test` | banco manual de teste com seed proprio |
| `postgres-e2e` | banco isolado para automacao E2E |
| `api` | container da API em desenvolvimento |

## Pre-requisitos

- Node.js 20+
- npm
- Docker com Compose

No PowerShell, use `npm.cmd` se `npm.ps1` estiver bloqueado.

## Comandos equivalentes por shell

| Acao | PowerShell | Git Bash |
| --- | --- | --- |
| instalar dependencias | `npm.cmd install` | `npm install` |
| subir stack principal | `docker compose up -d --build` | `docker compose up -d --build` |
| iniciar API local | `npm.cmd run start:dev` | `npm run start:dev` |
| rodar testes | `npm.cmd run test` | `npm run test` |
| rodar E2E | `npm.cmd run test:e2e` | `npm run test:e2e` |

## Arquivos de ambiente

### `.env`

Arquivo principal de desenvolvimento.

Valores principais no estado atual:

- `PORT=3001`
- `DB_HOST=localhost`
- `DB_PORT=5434`
- `DB_DATABASE=api_db`
- `DB_TEST_HOST=localhost`
- `DB_TEST_PORT=5433`
- `DB_TEST_DATABASE=api_db_test`

Uso real:

- fora do Docker, a API principal usa `localhost:5434`
- dentro do container `api`, o Compose sobrescreve `DB_HOST=postgres` e `DB_PORT=5432`

### `.env.test`

Arquivo do banco manual de teste.

Valores principais:

- `DB_HOST=127.0.0.1`
- `DB_PORT=5433`
- `DB_DATABASE=api_db_test`

### `.env.e2e`

Arquivo do banco automatizado de E2E.

Valores principais:

- `DB_HOST=127.0.0.1`
- `DB_PORT=5436`
- `DB_DATABASE=api_db_e2e`

O bootstrap E2E le `.env` e `.env.e2e`, injeta o alvo correto em `process.env`, aplica migrations e limpa as tabelas antes de montar o `AppModule`.

## Bancos usados no projeto

### Banco principal

- servico Docker: `postgres`
- porta local: `5434`
- banco: `api_db`
- usado pela API principal e pelas migrations locais

### Banco manual de teste

- servico Docker: `postgres-test`
- porta local: `5433`
- banco: `api_db_test`
- usado para QA manual e fluxo de seed/teste exploratorio

### Banco automatizado de E2E

- servico Docker: `postgres-e2e`
- porta local: `5436`
- banco: `api_db_e2e`
- usado apenas pelos testes E2E automatizados

Esses bancos nao devem ser reutilizados entre si.

## Docker Compose principal

Comando:

```powershell
docker compose up -d --build
```

Servicos que sobem:

- `postgres`
- `postgres-test`
- `api`

Bootstrap real do container `api`:

1. `npm run migration:run`
2. `npm run seed:dev`
3. `npm run bootstrap:test:dev`
4. `npm run start:dev`

Endpoints locais:

- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/api`

## API na maquina com banco em container

Quando quiser debugar o Nest fora do container:

1. suba apenas o banco principal:

```powershell
docker compose up -d postgres
```

2. aplique migrations:

```powershell
npm.cmd run migration:run
```

3. inicie a API:

```powershell
npm.cmd run start:dev
```

Nesse fluxo a API usa `DB_HOST=localhost` e `DB_PORT=5434`.

## Seeds

### Seed principal

```powershell
npm.cmd run seed:dev
```

Comportamento:

- executa apenas em banco vazio
- popula `api_db`

Versao destrutiva:

```powershell
npm.cmd run seed:dev:reset
```

### Seed do banco manual de teste

```powershell
npm.cmd run seed:test:dev
```

Versao destrutiva:

```powershell
npm.cmd run seed:test:dev:reset
```

Esses comandos usam `.env.test` e nao mudam o fluxo do E2E.

## Testes E2E

### Fluxo local padrao

```powershell
npm.cmd run test:e2e
```

Esse script:

1. sobe `postgres-e2e` se necessario
2. roda o Jest E2E no host
3. usa `test/integration/bootstrap.ts` para:
   - apontar o processo para `api_db_e2e`
   - aplicar migrations
   - limpar os dados antes da suite

### Fluxo com runner Docker efemero

```powershell
npm.cmd run test:e2e:docker
```

Esse script:

1. sobe `postgres-e2e`
2. cria um container temporario da `api`
3. injeta `DB_HOST=postgres-e2e` e `DB_PORT=5432`
4. executa a suite E2E diretamente no container

### Quando subir `postgres-e2e` manualmente

Use isso apenas se quiser inspecionar o banco E2E fora do fluxo de teste:

```powershell
docker compose --profile e2e up -d postgres-e2e
```

## Reset do banco manual de teste

Quando o volume de `postgres-test` estiver velho, inconsistente ou com credenciais divergentes:

```powershell
docker compose stop postgres-test
docker compose rm -f postgres-test
docker volume rm hub-backend_pgdata_test
npm.cmd run bootstrap:test:dev
```

## Ambiente isolado para mudancas de banco

O repositorio tambem tem `docker-compose.feature.yml`.

Servicos:

- `api-feature`
- `postgres-feature`

Portas:

- API feature: `3004`
- Postgres feature: `5435`
- banco: `api_db_feature`

Subida:

```powershell
docker compose -f docker-compose.feature.yml -p hub-backend-feature up -d --build
```

## Checklist rapido

### Desenvolvimento normal

1. `npm.cmd install`
2. revisar `.env`
3. `docker compose up -d --build`
4. abrir `http://localhost:3001/api`

### API fora do Docker

1. `npm.cmd install`
2. `docker compose up -d postgres`
3. `npm.cmd run migration:run`
4. `npm.cmd run start:dev`

### E2E

1. revisar `.env.e2e`
2. `npm.cmd run test:e2e`

## Observacoes finais

- `synchronize` esta desligado; o schema evolui por migrations
- `api_db`, `api_db_test` e `api_db_e2e` devem continuar separados
- o fluxo E2E atual nao depende de `postgres-test`
- se voce alterar schema ou entidades, atualize tambem `docs/guia-mudancas-no-banco.md` e `docs/esquema-banco-atual.md`
