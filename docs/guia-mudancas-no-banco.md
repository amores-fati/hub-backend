# Guia de Mudancas no Banco

## Objetivo

Este documento explica, com base no fluxo atual do projeto, como fazer uma nova mudanca de banco sem inventar etapa e sem depender de ajuste manual direto no PostgreSQL.

## Fontes auditadas

- `src/config/database.config.ts`
- `src/config/typeorm.datasource.ts`
- `package.json`
- `docker-compose.yml`
- `test/integration/bootstrap.ts`
- `src/adapters/out/migrations/1776384000000-InitialSchema.ts`
- `src/adapters/out/orm/*.ts`
- `src/adapters/out/repository/*.ts`
- `src/adapters/out/seeds/seed.ts`

## Regras estruturais do projeto hoje

### 1. O schema e versionado por migration

Em `src/config/database.config.ts`, `synchronize` esta configurado como `false`.

Na pratica isso significa:

- alterar uma entidade ORM nao muda o banco sozinha
- toda mudanca estrutural precisa virar migration

### 2. Runtime e CLI usam a mesma base de configuracao

O `DataSource` da CLI fica em:

- `src/config/typeorm.datasource.ts`

E ele usa o mesmo builder de configuracao do runtime:

- `src/config/database.config.ts`

### 3. O Docker da API ja roda migrations e seed no startup

O script `start:docker:dev` do `package.json` faz:

1. `migration:run`
2. `seed:dev`
3. `start:dev`

Ou seja, se voce subir a API pelo Compose, o container tenta aplicar as migrations pendentes, popular o banco vazio com o dataset de desenvolvimento e so depois iniciar o Nest.

### 4. O teste E2E tambem depende de migration

O bootstrap de `test/integration/bootstrap.ts`:

1. prepara o ambiente de teste
2. executa `runMigrations()`
3. limpa as tabelas

Entao mudar banco sem atualizar migration vai quebrar o fluxo real do projeto.

## Quando uma mudanca de banco exige mexer em mais de um lugar

Nem toda mudanca termina na entidade ORM.

Se a coluna nova passar pelo fluxo HTTP e negocio, normalmente voce tambem precisa revisar:

- DTOs em `src/adapters/in/dtos`
- comandos em `src/core/command`
- dominio em `src/core/domain`
- repositories em `src/adapters/out/repository`
- seed em `src/adapters/out/seeds/seed.ts`
- testes unitarios e E2E
- documentacao do schema

## Passo a passo recomendado

## Passo 1. Entenda exatamente o que muda

Antes de alterar codigo, responda estas perguntas:

1. a mudanca e nova tabela, nova coluna, rename, ajuste de tipo, indice ou constraint?
2. ela afeta o banco principal, o banco de teste ou os dois?
3. a regra precisa ser garantida no banco, na aplicacao ou nos dois?
4. existe dado antigo que precisa de backfill?

Exemplos:

- nova coluna opcional: costuma ser simples
- rename de coluna: quase sempre exige migration manual
- mudar `NULL` para `NOT NULL`: exige avaliar dados existentes
- novo `UNIQUE`: exige verificar se ja existem duplicados

## Passo 2. Ajuste a entidade ORM

As entidades ficam em:

- `src/adapters/out/orm`

Exemplo hipotetico: adicionar `application_deadline` em `job_openings`.

```ts
@Column({ name: 'application_deadline', type: 'date', nullable: true })
applicationDeadline: Date | null;
```

Se a mudanca afetar relacoes, ajuste tambem:

- `@JoinColumn`
- `@ManyToOne`
- `@OneToOne`
- `onDelete`
- `unique`

## Passo 3. Gere ou crie a migration

### Comandos equivalentes por shell

| Acao | PowerShell | Git Bash |
| --- | --- | --- |
| gerar migration | `node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:generate src/adapters/out/migrations/NomeDaMigration` | `./node_modules/.bin/typeorm-ts-node-commonjs -d src/config/typeorm.datasource.ts migration:generate src/adapters/out/migrations/NomeDaMigration` |
| criar migration vazia | `node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:create src/adapters/out/migrations/NomeDaMigration` | `./node_modules/.bin/typeorm-ts-node-commonjs -d src/config/typeorm.datasource.ts migration:create src/adapters/out/migrations/NomeDaMigration` |
| aplicar migrations | `node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:run` | `./node_modules/.bin/typeorm-ts-node-commonjs -d src/config/typeorm.datasource.ts migration:run` |
| reverter ultima migration | `node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:revert` | `./node_modules/.bin/typeorm-ts-node-commonjs -d src/config/typeorm.datasource.ts migration:revert` |

### Opcao A: gerar a migration a partir da diferenca ORM x banco

Comando validado localmente:

```powershell
node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:generate src/adapters/out/migrations/AddApplicationDeadline
```

Comportamento real da CLI:

- o comando e `migration:generate <path>`
- o primeiro argumento depois de `migration:generate` e o caminho base da migration
- o arquivo final recebe timestamp automaticamente

Exemplo de resultado:

- `src/adapters/out/migrations/1777000000000-AddApplicationDeadline.ts`

### Opcao B: criar uma migration vazia

Use isso quando a mudanca for sensivel e voce quiser escrever o SQL manualmente.

Comando validado localmente:

```powershell
node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:create src/adapters/out/migrations/AddApplicationDeadline
```

Quando preferir `migration:create` em vez de `migration:generate`:

- rename de tabela
- rename de coluna
- backfill de dados
- mudanca destrutiva
- SQL especifico de Postgres
- ajuste fino de indice ou constraint

## Passo 4. Revise a migration linha por linha

Nao trate migration gerada como verdade final.

Revise pelo menos:

- nome das tabelas e colunas
- tipo SQL correto
- `NULL` versus `NOT NULL`
- `DEFAULT`
- `UNIQUE`
- `FOREIGN KEY`
- `ON DELETE`
- indices
- `down()` realmente reversivel

Perguntas obrigatorias na revisao:

1. a migration preserva a cardinalidade correta?
2. a constraint esta nomeada de forma coerente com o padrao do projeto?
3. o `down()` desfaz so o que o `up()` fez?
4. existe risco de apagar dados sem querer?

## Passo 5. Aplique a migration no banco principal local

Se voce estiver usando so o Postgres em container:

```powershell
docker compose up -d postgres
```

Depois rode:

```powershell
npm.cmd run migration:run
```

Se o wrapper do TypeORM falhar no Windows, use a forma direta:

```powershell
node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:run
```

## Passo 6. Valide a aplicacao

Depois da migration, valide os pontos que mudaram:

1. suba a API
2. exercite os endpoints afetados
3. confira seed, se a tabela ou coluna fizer parte dos dados de desenvolvimento
4. rode testes

Comandos comuns:

```powershell
npm.cmd run start:dev
npm.cmd run test
npm.cmd run test:e2e
```

Se quiser isolar o teste E2E no Docker:

```powershell
npm.cmd run test:e2e:docker
```

## Passo 7. Atualize as camadas que mapeiam a persistencia

No projeto atual isso costuma aparecer nestes pontos:

- repositories: `src/adapters/out/repository`
- DTOs: `src/adapters/in/dtos`
- dominio: `src/core/domain`
- comandos: `src/core/command`

Exemplos reais do repositorio:

- `StudentRepository` monta `UserOrmEntity`, `ContactOrmEntity`, `DisabilityOrmEntity`, `SocialBenefitOrmEntity` e `AccessibilityResourceOrmEntity`
- `CompanyRepository` monta `UserOrmEntity`, `ContactOrmEntity` e `CompanyOrmEntity`
- `CourseRepository` precisa refletir exatamente as colunas de `courses`

Ou seja: se voce adicionar uma coluna numa entidade e esquecer o repository, a migration pode rodar, mas o dado nao vai trafegar pela aplicacao.

## Passo 8. Atualize seed e documentacao quando fizer sentido

Revise `src/adapters/out/seeds/seed.ts` quando:

- a nova coluna for `NOT NULL`
- a nova tabela precisar de dados de exemplo
- uma FK nova exigir ordem diferente de insercao
- a stack Docker principal passar a quebrar na subida por causa do novo schema

Atualize tambem:

- `docs/esquema-banco-atual.md`
- qualquer guia operacional impactado

## Passo 9. Saiba como desfazer

Se a ultima migration ainda nao deveria ter sido aplicada:

```powershell
npm.cmd run migration:revert
```

Alternativa direta validada localmente:

```powershell
node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:revert
```

Use rollback com cuidado.

Se a migration fez backfill ou alteracao destrutiva, o `down()` precisa ter sido planejado de antemao.

## Exemplo completo de fluxo

Exemplo: adicionar uma coluna opcional `application_deadline` em `job_openings`.

### 1. Ajustar a entidade

- arquivo: `src/adapters/out/orm/jobs.orm-entity.ts`
- adicionar a coluna com `nullable: true`

### 2. Gerar a migration

```powershell
node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:generate src/adapters/out/migrations/AddApplicationDeadline
```

### 3. Revisar o SQL gerado

Esperado no `up()`:

- `ALTER TABLE "job_openings" ADD "application_deadline" date`

Esperado no `down()`:

- `ALTER TABLE "job_openings" DROP COLUMN "application_deadline"`

### 4. Aplicar

```powershell
docker compose up -d postgres
node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts migration:run
```

### 5. Validar

- criar ou listar vaga, se o fluxo HTTP existir
- revisar seed se essa coluna passar a ser obrigatoria
- rodar `test:e2e` se a mudanca tocar regras compartilhadas

## O que nao fazer

- nao editar o banco manualmente e depois fingir a migration com `--fake` sem necessidade real
- nao apontar `.env.test` para o mesmo banco de `.env`
- nao confiar que a entidade ORM sozinha vai atualizar o schema
- nao usar seed para criar schema
- nao misturar mudanca de schema com varios refactors sem relacao na mesma migration

## Checklist final antes de fechar a mudanca

1. entidade ORM ajustada
2. migration criada
3. migration revisada manualmente
4. migration aplicada no banco principal local
5. repository e mapeamentos ajustados
6. DTO, comando e dominio revisados, se a mudanca sobe para a API
7. seed revisado, se necessario
8. testes executados
9. documentacao do schema atualizada

## Observacao importante sobre Windows

Neste ambiente foi possivel validar diretamente os comandos:

- `migration:create`
- `migration:generate`
- `migration:run`
- `migration:revert`

pela forma:

```powershell
node_modules\.bin\typeorm-ts-node-commonjs.cmd -d src/config/typeorm.datasource.ts <comando>
```

Se o seu PowerShell bloquear `npm.ps1` ou se o wrapper do script falhar, essa forma direta e a mais previsivel no Windows.
