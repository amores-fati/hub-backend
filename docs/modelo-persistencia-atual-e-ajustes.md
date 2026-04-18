# Modelo de persistencia atual e ajustes necessarios

## Status

Este documento ficou historico.

Ele registra uma fase anterior da migracao para TypeORM e ainda menciona drifts ja corrigidos no repositorio atual.

Para o estado vigente da persistencia, use:

- `docs/esquema-banco-atual.md`
- `src/config/database.config.ts`
- `src/adapters/out/migrations/1776384000000-InitialSchema.ts`
- `src/adapters/out/migrations/1776470400000-AddUserCreatedAtAndStudentControlledValues.ts`
- `src/adapters/out/migrations/1776556800000-TrimLegacyContactColumnsAndProtectStudentLists.ts`

## Objetivo

Este documento registra:

- o que existe hoje no schema e no ORM da branch `feature/type-orm-migrations-bd`
- o estado atual de PK, UK e FK
- os principais drifts entre API, dominio, ORM e migration
- o ponto de partida recomendado para implementacao

Este arquivo e operacional.
Ele serve para orientar a mudanca no codigo sem perder tempo reabrindo o diagnostico a cada etapa.

---

## Ponto de partida recomendado

Nao faz sentido comecar alterando as entidades de negocio primeiro.

O melhor ponto de partida e:

1. centralizar a configuracao do TypeORM
2. fazer runtime e CLI usarem a mesma base
3. registrar o estado real das tabelas e relacoes
4. so depois ajustar schema, constraints e drifts de modelagem

Motivo:

- hoje o principal problema e de fluxo de persistencia
- ainda ha drift entre migration, ORM e runtime
- mudar entidades antes de unificar a configuracao aumenta o risco de mexer em cima de uma base inconsistente

---

## Inventario atual das tabelas

### `users`

- existe no ORM e na migration
- PK: `id`
- tipo do identificador: `uuid`
- colunas principais:
  - `email`
  - `password`
- FKs:
  - nenhuma declarada na propria tabela
- UK:
  - a baseline original nao protegia `email` com unique

Status:

- estruturalmente faz sentido como tabela raiz de autenticacao
- a branch adiciona `unique(email)` via migration corretiva
- `password` deveria idealmente se chamar `password_hash`

### `admins`

- existe no ORM e na migration
- PK: `id`
- FK:
  - `id -> users.id`
- natureza da relacao:
  - subtipo de `users` com shared primary key

Status:

- bom desenho para o contexto atual

### `contacts`

- existe no ORM e na migration
- PK: `id`
- colunas principais:
  - `phone`
  - `neighbourhood`
  - `state`
  - `city`
  - `address`
  - `cep`
  - `complement`
- FK no banco:
  - `id -> users.id`
- no ORM atual:
  - a relacao com `users` nao esta modelada explicitamente

Status:

- a responsabilidade da tabela faz sentido
- a branch explicita no ORM a relacao `contacts.id -> users.id`

### `students`

- existe no ORM e na migration
- PK: `id`
- FKs:
  - `id -> users.id` via relacao 1:1 no ORM
  - `contact_id -> contacts.id`
- UK:
  - `unique(contact_id)` existe
- colunas principais:
  - `cpf`
  - `social_name`
  - `date_of_birth`
  - `gender`
  - `gender_other`
  - `color`
  - `education`
  - `course`
  - `institution`
  - `area_activity`
  - `programming_exp`
  - `tecnology_course`
  - `which_courses`
  - `send_curriculum`
  - `motivation`
  - `how_know`
  - `has_computer`
  - `has_internet`
  - `compromisse`

Status:

- desenho geral faz sentido
- a branch adiciona `unique(cpf)` via migration corretiva
- varios nomes estao inconsistentes ou com typos
- o banco esta mais permissivo que o contrato da API atual

### `disabilities`

- existe no ORM e na migration
- PK: `student_id`
- FK:
  - `student_id -> students.id`
- natureza da relacao:
  - 1:1 com `students`

Status:

- boa modelagem para o caso atual

### `accessibility_resources`

- existe no ORM e na migration
- PK: `id` serial
- FK:
  - `student_id -> students.id`
- natureza da relacao:
  - N:1 para `students`

Status:

- modelagem faz sentido
- a baseline original tinha drift entre ORM e migration no delete
- a branch corrige a FK para `ON DELETE CASCADE`

### `social_benefits`

- existe no ORM e na migration
- PK: `id` serial
- FK:
  - `student_id -> students.id`
- natureza da relacao:
  - N:1 para `students`

Status:

- modelagem faz sentido
- a baseline original tinha drift entre ORM e migration no delete
- a branch corrige a FK para `ON DELETE CASCADE`

### `companies`

- existe no ORM e na migration
- PK: `id`
- FKs:
  - `id -> users.id` via relacao 1:1 no ORM
  - `contact_id -> contacts.id`
- UK:
  - `unique(contact_id)` existe
- colunas principais:
  - `cnpj`
  - `name`
  - `ownerName`

Status:

- desenho faz sentido
- a branch adiciona `unique(cnpj)` via migration corretiva

### `jobs`

- existe no ORM e na migration
- PK: `id`
- FK:
  - `company_id -> companies.id`
- colunas principais:
  - `name`
  - `description`
  - `jobs_number`
  - `pcd`

Status:

- bom desenho relacional
- e melhor do que acoplar a PK da vaga ao ID da empresa

### `curriculums`

- existe no ORM e na migration
- PK: `id`
- FK:
  - `student_id -> students.id`
- UK:
  - `unique(student_id)` existe

Status:

- desenho 1:1 com PK propria e FK unica faz sentido
- nomenclatura tem typos (`is_avaliable`, `video_apresentation`)

### `skills`

- existe no ORM e na migration
- PK: `id`
- UK:
  - `unique(name)` existe

Status:

- boa tabela de referencia

### `skills_curriculum`

- existe no ORM e na migration
- PK composta:
  - `curriculum_id`
  - `skill_id`
- FKs:
  - `curriculum_id -> curriculums.id`
  - `skill_id -> skills.id`

Status:

- modelagem adequada para N:N

### `skills_job`

- existe no ORM e na migration
- PK composta:
  - `job_id`
  - `skill_id`
- FKs:
  - `job_id -> jobs.id`
  - `skill_id -> skills.id`

Status:

- modelagem adequada para N:N

### `courses`

- existe no ORM e na migration
- PK: `id`
- colunas principais:
  - `name`
  - `banner`
  - `description`
  - `course_load`
  - `start_date`
  - `end_date`
  - `start_registrations`
  - `end_registrations`
  - `link_access`

Status:

- schema, DTO, dominio e repository agora usam o mesmo conjunto de campos
- `description` continua opcional, coerente com a coluna nullable no banco

### `person_courses`

- existe no ORM e na migration
- PK: `id`
- FK:
  - `courseId -> courses.id`
- UK:
  - `unique(courseId)` existe

Status:

- faz sentido se a regra de negocio for "um curso presencial por curso"
- se houver mais de uma turma/oferta por curso no futuro, esse desenho precisara mudar
- nomenclatura tem typo (`adress`)

---

## Principais problemas atuais

### 1. A baseline nao protegia uniques de negocio

A migration original nao protegia:

- `users.email`
- `students.cpf`
- `companies.cnpj`

Impacto:

- a regra existe no codigo, mas nao esta protegida no schema
- ha risco de corrida e inconsistencias sob concorrencia

### 2. Existia drift entre migration e ORM

Casos mais claros:

- `accessibility_resources.student_id`
- `social_benefits.student_id`

No ORM, o relacionamento usa `onDelete: 'CASCADE'`.
Na migration original, a FK foi criada com `ON DELETE NO ACTION`.

Impacto:

- o comportamento real do banco pode divergir do esperado no codigo
- esta branch corrige esse ponto na migration complementar

### 3. `Course` estava inconsistente entre camadas

Antes desta branch:

- DTO aceitava apenas `title` e `description`
- dominio carregava apenas `id`, `name`, `description`
- ORM e banco exigiam `banner`, `course_load`, datas e `link_access`

Correcao aplicada:

- DTO, service, dominio e repository passaram a usar:
  - `name`
  - `banner`
  - `description`
  - `courseLoad`
  - `startDate`
  - `endDate`
  - `startRegistrations`
  - `endRegistrations`
  - `linkAccess`

### 4. O banco esta mais frouxo do que a API em alguns pontos

Exemplo:

- `student.birthDate`, `gender` e `race` sao obrigatorios no DTO de criacao
- no banco, esses campos estao como nullable

Impacto:

- o contrato HTTP nao esta refletido no nivel de persistencia

### 5. Existem problemas de nomenclatura

Exemplos:

- `is_avaliable`
- `video_apresentation`
- `adress`
- `tecnology_course`
- `compromisse`

Impacto:

- piora manutencao
- dificulta leitura
- aumenta custo de futuras migrations

---

## O que deve mudar

### Implementado nesta branch

- configuracao central do TypeORM
- `DataSource` unico para CLI
- runtime com `synchronize: false`
- primeira migration corretiva de integridade
- unique em:
  - `users.email`
  - `students.cpf`
  - `companies.cnpj`
- FKs compartilhadas:
  - `students.id -> users.id`
  - `companies.id -> users.id`
- alinhamento de delete cascade em:
  - `accessibility_resources.student_id`
  - `social_benefits.student_id`
- ajuste do path de migrations para resolver melhor entre `src` e `dist`
- alinhamento do modelo de `Contact` com `Student` e `Company`:
  - `contacts.id` passa a seguir o mesmo id de `users`
  - `StudentService` deixa de gerar `Contact` com id aleatorio
- alinhamento completo de `Course` entre:
  - DTO
  - service
  - dominio
  - repository
  - schema `courses`
- seed de desenvolvimento desacoplado do bootstrap:
  - `seed:dev` executa apenas em banco vazio
  - `seed:dev:reset` faz limpeza e recriacao explicitas
- bootstrap E2E com banco de teste preparado por migrations antes do `AppModule`

### Mudancas imediatas

- unificar configuracao do TypeORM
- fazer CLI e runtime usarem a mesma base
- manter inventario explicito das entities
- parar de depender de configuracao duplicada
- manter seed destrutivo fora do startup da aplicacao

### Mudancas de schema prioritarias

- revisar se os novos uniques e FKs estao aderentes aos dados reais do banco
- alinhar os demais pontos de divergencia entre ORM e migration

### Mudancas de modelagem prioritarias

- revisar nomes de colunas com typo

---

## Ordem recomendada de implementacao

1. centralizar configuracao do TypeORM
2. ajustar scripts de migration
3. consolidar inventario de schema e drifts
4. corrigir constraints estruturais
5. revisar testes, Docker e seed
6. so depois considerar refactor organizacional de `orm/entities` e mappers dedicados

---

## Observacao final

O modelo atual nao esta errado.

Ele ja tem uma base relacional coerente.
O problema principal hoje e de consistencia entre:

- migration
- ORM
- runtime
- contrato da API

Por isso, o primeiro passo certo nao e redesenhar tudo.
O primeiro passo certo e estabilizar a camada de persistencia e tornar o fluxo previsivel.
