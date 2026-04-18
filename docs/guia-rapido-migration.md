# Guia Rapido de Migration

## Objetivo

Registrar o fluxo minimo para alterar schema sem drift entre banco, ORM e aplicacao.

## Passo 1. Ajuste a entidade ORM

Edite os arquivos em `src/adapters/out/orm/`.

Se a mudanca tocar relacoes ou integridade, revise tambem:

- `@JoinColumn`
- `nullable`
- `foreignKeyConstraintName`
- `@Index`
- `@Check`

## Passo 2. Gere ou crie a migration

### PowerShell

```powershell
node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:generate src/adapters/out/migrations/NomeDaMigration
```

### Git Bash

```bash
./node_modules/.bin/typeorm-ts-node-commonjs -d src/config/typeorm.datasource.ts migration:generate src/adapters/out/migrations/NomeDaMigration
```

Use `migration:create` em vez de `migration:generate` quando houver rename, backfill ou SQL manual.

## Passo 3. Revise a migration

Confira pelo menos:

- tipos SQL
- `NULL` vs `NOT NULL`
- `DEFAULT`
- FKs e `ON DELETE`
- nomes de constraints
- indices
- `down()` reversivel

## Passo 4. Aplique

```powershell
docker compose up -d postgres
npm.cmd run migration:run
```

## Passo 5. Valide o alinhamento

```powershell
npm.cmd run migration:show
npm.cmd run typeorm -- schema:log
```

O resultado esperado de `schema:log` e:

```text
Your schema is up to date - there are no queries to be executed by schema synchronization.
```

## Passo 6. Rode testes

```powershell
npm.cmd run test -- --runInBand
npm.cmd run test:e2e
```

## Passo 7. Atualize docs

Revise no minimo:

- `docs/esquema-banco-atual.md`
- `docs/modelo-alvo-banco.md`
- `docs/guia-mudancas-no-banco.md`

## Referencia completa

Use `docs/guia-mudancas-no-banco.md` para o fluxo detalhado.
