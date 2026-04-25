# Diretrizes TypeORM, Migrations e Arquitetura

## Objetivo

Consolidar as regras que o projeto precisa seguir para manter dominio, ORM, migrations, testes e banco real alinhados.

## Estado atual consolidado

O repositorio ja opera hoje com:

- `buildDatabaseOptions()` centralizando a configuracao em `src/config/database.config.ts`
- `src/config/typeorm.datasource.ts` como entrada unica da CLI
- `synchronize: false`
- schema evoluindo apenas por migrations
- E2E aplicando migrations antes da suite
- metadata do TypeORM validado com `schema:log`

## Limites de camada

### `src/core`

Deve conter:

- dominio
- comandos
- ports
- regras de negocio

Nao deve conter:

- decorators do TypeORM
- detalhes de banco
- DTOs HTTP

### `src/adapters/in`

Deve conter:

- controllers
- DTOs
- integracao HTTP

DTO nao substitui dominio nem entidade ORM.

### `src/adapters/out`

Deve conter:

- entidades ORM
- repositories concretos
- migrations
- seeds
- integracoes externas

## Regras para persistencia

### 1. Schema muda so por migration

Mudancas estruturais exigem migration:

- tabela
- coluna
- tipo
- nullability
- indice
- unique
- FK
- `CHECK`
- remocao ou rename

### 2. ORM precisa refletir o schema real

As entidades ORM devem espelhar:

- nomes de colunas
- nullability
- constraints
- indices
- nomes explicitos de FKs quando o banco ja os possui

Se `schema:log` gerar SQL pendente depois da migration, ainda existe drift.

### 3. Seed nao corrige schema

Seed serve para:

- dados de desenvolvimento
- base controlada de teste manual

Seed nao serve para:

- criar tabela
- corrigir coluna
- compensar migration ausente

## Regras para repositories

Repositories concretos devem:

- implementar ports do core
- mapear ORM para dominio
- mapear dominio para ORM
- evitar regra de negocio estrutural

Quando o agregado crescer demais, extrair mapper dedicado e aceitavel. Quando o mapeamento for simples, manter privado no repository tambem e aceitavel.

## Regras para testes

### Unitarios

Devem validar dominio, services e contratos da aplicacao sem depender do banco real.

### E2E

Devem seguir o fluxo real de persistencia:

1. apontar para o banco E2E
2. aplicar migrations
3. limpar os dados
4. executar a suite

No estado atual, `npm run test:e2e` ja sobe `postgres-e2e` automaticamente.

## Estrutura recomendada

Esta organizacao continua adequada:

- `src/core`
- `src/adapters/in`
- `src/adapters/out`
- `src/config`
- `test`

Mover entidades para outra subpasta dentro de `orm/` e opcional. Nao e prioridade enquanto o fluxo de schema estiver limpo e previsivel.

## O que evitar

- `synchronize: true`
- ajuste manual de schema como fluxo principal
- decorator do TypeORM no core
- DTO acumulando responsabilidade de dominio
- confiar em migration gerada sem revisao humana
- fechar PR com `schema:log` pendente

## Checklist estrutural

Antes de considerar uma mudanca pronta:

1. ORM ajustado
2. migration criada ou revisada
3. migration aplicada
4. `npm run typeorm -- schema:log` limpo
5. repositories, services, comandos e DTOs revisados
6. testes executados
7. docs atualizadas

## Referencias

- `docs/guia-mudancas-no-banco.md`
- `docs/esquema-banco-atual.md`
- `docs/modelo-alvo-banco.md`
