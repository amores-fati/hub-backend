# Guia de Mudancas no Banco

## Objetivo

Este guia descreve o fluxo atual para alterar schema sem drift entre:

- entidades ORM
- migrations
- banco real
- services, DTOs e repositories
- testes
- documentacao

## Fontes auditadas

- `package.json`
- `src/config/database.config.ts`
- `src/config/typeorm.datasource.ts`
- `docker-compose.yml`
- `test/integration/bootstrap.ts`
- `src/adapters/out/orm/*.ts`
- `src/adapters/out/migrations/*.ts`
- `src/adapters/out/repository/*.ts`

## Regras do projeto hoje

### 1. O schema e versionado por migration

`synchronize` esta em `false`.

Consequencia pratica:

- mudar entidade ORM nao muda banco sozinho
- toda mudanca estrutural precisa virar migration

### 2. Runtime e CLI usam a mesma base

O runtime e a CLI do TypeORM usam `buildDatabaseOptions()` em `src/config/database.config.ts`.

### 3. A stack Docker ja roda migration e seed

`start:docker:dev` executa:

1. `migration:run`
2. `seed:dev`
3. `bootstrap:test:dev`
4. `start:dev`

### 4. O bootstrap E2E tambem depende de migration

`test/integration/bootstrap.ts`:

1. resolve o alvo E2E
2. aplica migrations
3. limpa as tabelas
4. monta o `AppModule`

Se o banco e o metadata estiverem desalinhados, o E2E e o primeiro lugar onde isso aparece.

## Quando uma mudanca de banco exige mais de um ajuste

Revise tambem:

- DTOs em `src/adapters/in/dtos`
- comandos em `src/core/command`
- dominio em `src/core/domain`
- repositories em `src/adapters/out/repository`
- seed em `src/adapters/out/seeds/seed.ts`
- testes unitarios e E2E
- docs de schema e operacao

## Passo a passo recomendado

### 1. Defina a mudanca com precisao

Antes de editar:

1. e nova coluna, nova tabela, rename, ajuste de tipo, indice ou constraint?
2. exige backfill?
3. muda nullability?
4. a regra deve ser garantida no banco, na aplicacao ou nos dois?

### 2. Ajuste a entidade ORM

Arquivos em `src/adapters/out/orm`.

Exemplo: adicionar `application_deadline` em `job_openings`:

```ts
@Column({ name: 'application_deadline', type: 'date', nullable: true })
applicationDeadline: Date | null;
```

Se a mudanca tocar relacoes, revise tambem:

- `@JoinColumn`
- `@ManyToOne`
- `@OneToOne`
- `nullable`
- `onDelete`
- `foreignKeyConstraintName`
- `@Index`
- `@Check`

### 3. Gere ou crie a migration

#### PowerShell

```powershell
node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:generate src/adapters/out/migrations/AddApplicationDeadline
node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:create src/adapters/out/migrations/AddApplicationDeadline
```

#### Git Bash

```bash
./node_modules/.bin/typeorm-ts-node-commonjs -d src/config/typeorm.datasource.ts migration:generate src/adapters/out/migrations/AddApplicationDeadline
./node_modules/.bin/typeorm-ts-node-commonjs -d src/config/typeorm.datasource.ts migration:create src/adapters/out/migrations/AddApplicationDeadline
```

Use `migration:create` quando houver:

- rename de coluna ou tabela
- backfill
- SQL especifico de Postgres
- mudanca destrutiva

### 4. Revise a migration linha por linha

Confira pelo menos:

- tipos SQL
- `NULL` vs `NOT NULL`
- `DEFAULT`
- `UNIQUE`
- `FOREIGN KEY`
- `ON DELETE`
- nomes de constraints
- indices
- `down()` reversivel

### 5. Aplique no banco local

Se estiver usando apenas o banco principal:

```powershell
docker compose up -d postgres
npm.cmd run migration:run
```

### 6. Verifique drift ORM x banco

Depois de aplicar a migration, valide:

```powershell
npm.cmd run migration:show
npm.cmd run typeorm -- schema:log
```

O esperado para `schema:log` e:

```text
Your schema is up to date - there are no queries to be executed by schema synchronization.
```

Se aparecer SQL pendente, o metadata do TypeORM ainda nao bate com o banco real.

### 7. Revise repositories, services e DTOs

No projeto atual, os pontos mais sensiveis sao:

- `StudentRepository`
- `CompanyRepository`
- DTOs em `src/adapters/in/dtos`
- comandos em `src/core/command`
- entidades de dominio em `src/core/domain`

Exemplo real:

- remover uma coluna do banco sem limpar DTOs e repositories deixa o schema certo, mas quebra persistencia e E2E

### 8. Revise o seed

Atualize `src/adapters/out/seeds/seed.ts` quando:

- a nova coluna for `NOT NULL`
- a nova tabela precisar de dados de exemplo
- uma FK nova mudar a ordem de insercao

### 9. Rode testes

Fluxo minimo:

```powershell
npm.cmd run test -- --runInBand
npm.cmd run test:e2e
```

Se quiser o runner Docker isolado:

```powershell
npm.cmd run test:e2e:docker
```

### 10. Atualize a documentacao

Arquivos minimos:

- `docs/esquema-banco-atual.md`
- `docs/modelo-alvo-banco.md`
- qualquer guia operacional impactado

## Exemplo completo

Exemplo: adicionar `application_deadline` em `job_openings`.

### 1. Ajustar entidade

- arquivo: `src/adapters/out/orm/job-opening.orm-entity.ts`

### 2. Gerar migration

```powershell
node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:generate src/adapters/out/migrations/AddApplicationDeadline
```

### 3. Revisar SQL esperado

- `ALTER TABLE "job_openings" ADD COLUMN "application_deadline" date`
- `ALTER TABLE "job_openings" DROP COLUMN "application_deadline"`

### 4. Aplicar e validar

```powershell
docker compose up -d postgres
npm.cmd run migration:run
npm.cmd run typeorm -- schema:log
```

### 5. Rodar testes

```powershell
npm.cmd run test -- --runInBand
npm.cmd run test:e2e
```

## O que nao fazer

- nao editar o banco manualmente e fingir migration sem motivo real
- nao confiar que a entidade ORM sozinha atualiza o schema
- nao usar seed para criar schema
- nao apontar `.env.test` ou `.env.e2e` para o mesmo banco de `.env`
- nao fechar PR com `schema:log` pendente

## Checklist final

1. entidade ORM ajustada
2. migration criada
3. migration revisada
4. migration aplicada
5. `schema:log` sem queries pendentes
6. repositories, DTOs, comandos e dominio revisados
7. seed revisado, se necessario
8. testes executados
9. docs atualizadas
