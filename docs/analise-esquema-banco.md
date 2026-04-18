# Analise do Esquema Relacional

## Status

Este documento ficou historico.

Ele descreve um banco anterior ao fluxo atual de migrations versionadas no repositorio e nao deve mais ser usado como referencia de schema vigente.

Para o estado atual do projeto, use:

- `docs/esquema-banco-atual.md`
- `src/adapters/out/migrations/1776384000000-InitialSchema.ts`
- `src/adapters/out/migrations/1776470400000-AddUserCreatedAtAndStudentControlledValues.ts`
- `src/adapters/out/migrations/1776556800000-TrimLegacyContactColumnsAndProtectStudentLists.ts`

## Escopo

- Banco analisado: `api_db`
- Fonte principal: schema real do PostgreSQL em execucao
- Fontes complementares: entidades TypeORM em `src/adapters/out/orm` e migration `1775858784315-InitialSchema.ts`
- Observacao importante: este documento prioriza o **estado real do banco**. Em alguns pontos, o banco atual diverge da migration inicial.

## Resumo Executivo

- Tabelas de negocio atuais: `15`
- Tabela tecnica: `migrations`
- PKs simples: todas as tabelas, exceto `skills_job` e `skills_curriculum`
- PKs compostas: `skills_job(job_id, skill_id)` e `skills_curriculum(curriculum_id, skill_id)`
- UNIQUEs relevantes:
  - `skills.name`
  - `students.contact_id`
  - `companies.contact_id`
  - `curriculums.student_id`
  - `person_courses.courseId`
- CHECK constraints de dominio: nenhuma
- CHECK constraints atuais: apenas `NOT NULL`

## Mapa de Relacionamentos

```text
users
|- 1:1 admins
|- 1:1 students
`- 1:1 companies

contacts
|- 1:1 students
`- 1:1 companies

students
|- 1:1 disabilities
|- 1:1 curriculums
|- 1:N accessibility_resources
`- 1:N social_benefits

companies
`- 1:N jobs

jobs
`- N:N skills (via skills_job)

curriculums
`- N:N skills (via skills_curriculum)

courses
`- 1:1 person_courses
```

## Inventario de Tabelas

### `users`

- PK:
  - `PK_a3ffb1c0c8416b9fc6f907b7433` em `id`
- UNIQUE:
  - nenhuma
- FKs de saida:
  - nenhuma
- FKs recebidas:
  - `students.id -> users.id`
  - `companies.id -> users.id`
  - `admins.id -> users.id`
- Relacionamentos:
  - `1:1` com `students` por PK compartilhada
  - `1:1` com `companies` por PK compartilhada
  - `1:1` com `admins` por PK compartilhada
- Colunas:
  - `id uuid not null`
  - `email varchar(100) not null`
  - `password varchar(100) not null`
- Observacoes:
  - nao existe coluna `role`
  - `email` ainda nao possui `UNIQUE`

### `admins`

- PK:
  - `PK_e3b38270c97a854c48d2e80874e` em `id`
- UNIQUE:
  - nenhuma alem da PK
- FKs de saida:
  - `FK_e3b38270c97a854c48d2e80874e`: `id -> users.id`, `ON DELETE CASCADE`
- Relacionamentos:
  - `1:1` com `users`
- Colunas:
  - `id uuid not null`

### `contacts`

- PK:
  - `PK_b99cd40cfd66a99f1571f4f72e6` em `id`
- UNIQUE:
  - nenhuma alem da PK
- FKs de saida:
  - nenhuma no banco atual
- FKs recebidas:
  - `students.contact_id -> contacts.id`
  - `companies.contact_id -> contacts.id`
- Relacionamentos:
  - `1:1` com `students` via `students.contact_id` unico
  - `1:1` com `companies` via `companies.contact_id` unico
- Colunas:
  - `id uuid not null`
  - `phone varchar(20) not null`
  - `neighbourhood varchar null`
  - `state char(2) null`
  - `city varchar(100) null`
  - `address varchar(255) null`
  - `cep varchar(9) null`
  - `complement varchar(255) null`
- Observacoes:
  - o banco atual **nao** possui `contacts.id -> users.id`
  - faltam `name` e `country` em relacao ao escopo desejado

### `students`

- PK:
  - `PK_7d7f07271ad4ce999880713f05e` em `id`
- UNIQUE:
  - `REL_bf10ac3133366a425a3825f168` em `contact_id`
- FKs de saida:
  - `FK_7d7f07271ad4ce999880713f05e`: `id -> users.id`, `ON DELETE CASCADE`
  - `FK_bba38a1682e9277729a859e08f3`: `contact_id -> contacts.id`, `ON DELETE CASCADE`
- FKs recebidas:
  - `disabilities.student_id -> students.id`
  - `curriculums.student_id -> students.id`
  - `accessibility_resources.student_id -> students.id`
  - `social_benefits.student_id -> students.id`
- Relacionamentos:
  - `1:1` com `users` por PK compartilhada
  - `1:1` com `contacts` via `contact_id` unico
  - `1:1` com `disabilities`
  - `1:1` com `curriculums`
  - `1:N` com `accessibility_resources`
  - `1:N` com `social_benefits`
- Colunas:
  - `id uuid not null`
  - `cpf varchar not null`
  - `social_name varchar null`
  - `date_of_birth timestamp null`
  - `gender varchar null`
  - `gender_other varchar null`
  - `color varchar null`
  - `education varchar null`
  - `course varchar null`
  - `institution varchar null`
  - `area_activity varchar null`
  - `programming_exp boolean null`
  - `tecnology_course boolean null`
  - `which_courses text null`
  - `send_curriculum boolean null`
  - `motivation text null`
  - `how_know varchar null`
  - `has_computer boolean null`
  - `has_internet boolean null`
  - `compromisse boolean null`
  - `contact_id uuid null`
- Observacoes:
  - varios campos do escopo ainda estao sem `NOT NULL`
  - varios enums de dominio ainda estao como `varchar` livre
  - ha erros de nomenclatura: `tecnology_course`, `compromisse`

### `disabilities`

- PK:
  - `PK_802683ebba1754e8bd9b1cb0555` em `student_id`
- UNIQUE:
  - nenhuma alem da PK
- FKs de saida:
  - `FK_802683ebba1754e8bd9b1cb0555`: `student_id -> students.id`, `ON DELETE CASCADE`
- Relacionamentos:
  - `1:1` com `students`
- Colunas:
  - `student_id uuid not null`
  - `has_disability boolean not null default false`
  - `description text null`
  - `has_report varchar null`
  - `type varchar null`
- Observacoes:
  - a PK compartilhada em `student_id` esta correta para um `1:1` estrito
  - os valores de `has_report` e `type` ainda nao estao protegidos por enum/check

### `accessibility_resources`

- PK:
  - `PK_4390a3f7b2707e29c38c6361ec5` em `id`
- UNIQUE:
  - nenhuma
- FKs de saida:
  - `FK_1dec330e50d930370782ea0fa45`: `student_id -> students.id`, `ON DELETE CASCADE`
- Relacionamentos:
  - `N:1` com `students`
- Colunas:
  - `id serial not null`
  - `student_id uuid not null`
  - `resource varchar not null`
  - `resource_other varchar(100) null`
- Observacoes:
  - relacionamento esta adequado para multiplos recursos por aluno
  - `resource` ainda nao possui enum/check no banco

### `social_benefits`

- PK:
  - `PK_0aa7d6943bf1c46423aaa51ab14` em `id`
- UNIQUE:
  - nenhuma
- FKs de saida:
  - `FK_66642c5134fa3d3fe05a41b3bb7`: `student_id -> students.id`, `ON DELETE CASCADE`
- Relacionamentos:
  - `N:1` com `students`
- Colunas:
  - `id serial not null`
  - `student_id uuid not null`
  - `benefit varchar not null`
  - `benefit_other varchar(100) null`
- Observacoes:
  - relacionamento esta adequado para multiplos beneficios por aluno
  - `benefit` ainda nao possui enum/check no banco

### `companies`

- PK:
  - `PK_a019e9afe6517b4f2a4588f2cce` em `id`
- UNIQUE:
  - `REL_57be5fe8aafc63696053efc27f` em `contact_id`
- FKs de saida:
  - `FK_d4bc3e82a314fa9e29f652c2c22`: `id -> users.id`, `ON DELETE NO ACTION`
  - `FK_779b773150527a59b1493af4dfc`: `contact_id -> contacts.id`, `ON DELETE NO ACTION`
- FKs recebidas:
  - `jobs.company_id -> companies.id`
- Relacionamentos:
  - `1:1` com `users` por PK compartilhada
  - `1:1` com `contacts` via `contact_id` unico
  - `1:N` com `jobs`
- Colunas:
  - `id uuid not null`
  - `cnpj varchar(18) not null`
  - `name varchar(100) not null`
  - `ownerName varchar(100) not null`
  - `contact_id uuid null`
- Observacoes:
  - no escopo de negocio, esta tabela equivale a `enterprise`
  - `ownerName` representa hoje o papel de `responsible`

### `jobs`

- PK:
  - `PK_cf0a6c42b72fcc7f7c237def345` em `id`
- UNIQUE:
  - nenhuma alem da PK
- FKs de saida:
  - `FK_48970c58b3cbbc677f286cc0af5`: `company_id -> companies.id`, `ON DELETE CASCADE`
- FKs recebidas:
  - `skills_job.job_id -> jobs.id`
- Relacionamentos:
  - `N:1` com `companies`
  - `N:N` com `skills` via `skills_job`
- Colunas:
  - `id uuid not null default uuid_generate_v4()`
  - `company_id uuid not null`
  - `name varchar not null`
  - `description text null`
  - `jobs_number integer not null default 1`
  - `pcd boolean not null default false`
- Observacoes:
  - o desenho atual `company_id` esta correto para uma empresa ter varias vagas
  - a proposta `jobs.id -> enterprise.id` nao e adequada para um `1:N`
  - faltam `cnpj_enterprise` e `link` em relacao ao escopo desejado

### `curriculums`

- PK:
  - `PK_091de2c9968cf577f7bc933cee9` em `id`
- UNIQUE:
  - `REL_676cb81b59cfa58db274c614ef` em `student_id`
- FKs de saida:
  - `FK_676cb81b59cfa58db274c614efa`: `student_id -> students.id`, `ON DELETE CASCADE`
- FKs recebidas:
  - `skills_curriculum.curriculum_id -> curriculums.id`
- Relacionamentos:
  - `1:1` com `students` via `student_id` unico
  - `N:N` com `skills` via `skills_curriculum`
- Colunas:
  - `id uuid not null`
  - `is_avaliable boolean not null`
  - `about text null`
  - `linkedin varchar not null`
  - `github varchar not null`
  - `profile_photo varchar null`
  - `video_apresentation varchar not null`
  - `student_id uuid null`
- Observacoes:
  - hoje o modelo usa PK propria + `student_id` unico
  - se o curriculo for uma extensao `1:1` estrita do aluno, vale considerar PK compartilhada em `student_id`
  - ha erros de nomenclatura: `is_avaliable`, `video_apresentation`

### `skills`

- PK:
  - `PK_0d3212120f4ecedf90864d7e298` em `id`
- UNIQUE:
  - `UQ_81f05095507fd84aa2769b4a522` em `name`
- FKs recebidas:
  - `skills_job.skill_id -> skills.id`
  - `skills_curriculum.skill_id -> skills.id`
- Relacionamentos:
  - `N:N` com `jobs`
  - `N:N` com `curriculums`
- Colunas:
  - `id uuid not null`
  - `name varchar(100) not null`

### `skills_job`

- PK:
  - `PK_ea74e5d5eaefb24722077ccec20` em `(job_id, skill_id)`
- UNIQUE:
  - nenhuma alem da PK composta
- FKs de saida:
  - `FK_9ec1a1a7b3c883edde91459a859`: `job_id -> jobs.id`, `ON DELETE CASCADE`
  - `FK_703020b0c449a63d1c624d8f7d0`: `skill_id -> skills.id`, `ON DELETE NO ACTION`
- Relacionamentos:
  - tabela de associacao `N:N` entre `jobs` e `skills`
- Colunas:
  - `job_id uuid not null`
  - `skill_id uuid not null`

### `skills_curriculum`

- PK:
  - `PK_c5b6a03f7ad23bae4c510b089c7` em `(curriculum_id, skill_id)`
- UNIQUE:
  - nenhuma alem da PK composta
- FKs de saida:
  - `FK_3d1300dee6b99f55c52e4b8b856`: `curriculum_id -> curriculums.id`, `ON DELETE NO ACTION`
  - `FK_7a99bf92fbbc8f38a2b4bfef365`: `skill_id -> skills.id`, `ON DELETE NO ACTION`
- Relacionamentos:
  - tabela de associacao `N:N` entre `curriculums` e `skills`
- Colunas:
  - `curriculum_id uuid not null`
  - `skill_id uuid not null`

### `courses`

- PK:
  - `PK_3f70a44140be2baaa31e21ef375` em `id`
- UNIQUE:
  - nenhuma alem da PK
- FKs recebidas:
  - `person_courses.courseId -> courses.id`
- Relacionamentos:
  - `1:1` com `person_courses` via `courseId` unico no lado filho
- Colunas:
  - `id uuid not null`
  - `name varchar not null`
  - `banner varchar not null`
  - `description text null`
  - `course_load varchar not null`
  - `start_date timestamp not null`
  - `end_date timestamp not null`
  - `start_registrations timestamp not null`
  - `end_registrations timestamp not null`
  - `link_access varchar not null`
- Observacoes:
  - no escopo desejado, alguns nomes diferem: `course_oad`, `final_date`, `final_registrations`
  - `course_load` hoje esta como `varchar`, nao `int`

### `person_courses`

- PK:
  - `PK_b57822f498906415d6c378bf09e` em `id`
- UNIQUE:
  - `REL_b202f3d608ced36e970ad201ff` em `courseId`
- FKs de saida:
  - `FK_b202f3d608ced36e970ad201ffa`: `courseId -> courses.id`, `ON DELETE CASCADE`
- Relacionamentos:
  - `1:1` com `courses` via `courseId` unico
- Colunas:
  - `id uuid not null`
  - `adress varchar not null`
  - `start_date timestamp not null`
  - `shift varchar not null`
  - `room varchar not null`
  - `vacancies integer not null`
  - `courseId uuid null`
- Observacoes:
  - se for extensao `1:1` estrita de `courses`, faz mais sentido PK compartilhada em `course_id`
  - ha erro de nomenclatura: `adress`
  - `shift` ainda nao possui enum/check

### `migrations`

- Funcao:
  - controle de versao do schema
- PK:
  - `PK_8c82d7f526340ab734260ea46be` em `id`
- Colunas:
  - `id serial not null`
  - `timestamp bigint not null`
  - `name varchar not null`

## PKs, UKs e FKs Consolidadas

### Primary Keys

- `accessibility_resources(id)`
- `admins(id)`
- `companies(id)`
- `contacts(id)`
- `courses(id)`
- `curriculums(id)`
- `disabilities(student_id)`
- `jobs(id)`
- `migrations(id)`
- `person_courses(id)`
- `skills(id)`
- `skills_curriculum(curriculum_id, skill_id)`
- `skills_job(job_id, skill_id)`
- `social_benefits(id)`
- `students(id)`
- `users(id)`

### Unique Keys

- `companies(contact_id)`
- `curriculums(student_id)`
- `person_courses(courseId)`
- `skills(name)`
- `students(contact_id)`

### Foreign Keys

- `admins.id -> users.id`
- `companies.id -> users.id`
- `companies.contact_id -> contacts.id`
- `curriculums.student_id -> students.id`
- `disabilities.student_id -> students.id`
- `jobs.company_id -> companies.id`
- `person_courses.courseId -> courses.id`
- `skills_curriculum.curriculum_id -> curriculums.id`
- `skills_curriculum.skill_id -> skills.id`
- `skills_job.job_id -> jobs.id`
- `skills_job.skill_id -> skills.id`
- `social_benefits.student_id -> students.id`
- `accessibility_resources.student_id -> students.id`
- `students.id -> users.id`
- `students.contact_id -> contacts.id`

## Divergencias Entre Banco Atual e Escopo Desejado

### Ja existe, mas com nome ou modelagem diferente

- `enterprise` hoje esta como `companies`
- `responsible` hoje esta como `ownerName`
- `video_presentation` hoje esta como `video_apresentation`
- `is_available` hoje esta como `is_avaliable`
- `address` em `person_course` hoje esta como `adress`
- `technology_course` hoje esta como `tecnology_course`
- `compromise` hoje esta como `compromisse`

### Campos ausentes no banco atual

- `users.role`
- `contacts.name`
- `contacts.country`
- `jobs.cnpj_enterprise`
- `jobs.link`

### Modelagens que merecem revisao

- `jobs.id -> enterprise.id`
  - recomendacao: **nao implementar**
  - motivo: `jobs` deve continuar com PK propria e FK `company_id`, pois a cardinalidade correta e `company 1:N jobs`
- `students.id -> contact.id`
  - recomendacao: **nao misturar** com o modelo atual de `students.id -> users.id`
  - motivo: isso criaria dupla heranca relacional e redundancia estrutural
- `curriculum.id -> student.id`
  - recomendacao: valido se o curriculo for um `1:1` estrito
  - alternativa atual: manter `id` proprio e `student_id UNIQUE`
- `person_course.course_id` como PK compartilhada
  - recomendacao: faz sentido se `person_course` for sempre extensao obrigatoria de `course`

## Recomendacao de Modelagem

### Modelo recomendado para a identidade do usuario

- `users` deve ser a raiz de autenticacao
- `admins`, `students` e `companies` devem ser subtipos de `users` por PK compartilhada
- `contacts` deve ser uma entidade separada de dados de contato
- `students.contact_id` e `companies.contact_id` podem permanecer `UNIQUE` se o contato for exclusivo por entidade

### Decisoes recomendadas

- adicionar `UNIQUE(users.email)`
- decidir se `users.role` sera:
  - persistido em coluna
  - ou derivado exclusivamente pelos subtipos
- manter `jobs.company_id` como FK obrigatoria
- avaliar trocar `curriculums` e `person_courses` para PK compartilhada se o `1:1` for estrito
- adicionar enums ou `CHECK` para campos de dominio fechado

## Checklist Tecnico para a Proxima Iteracao

- criar migration para `UNIQUE(users.email)`
- decidir a estrategia para `users.role`
- normalizar nomes de colunas com erro de grafia
- revisar `NOT NULL` dos campos obrigatorios do escopo
- adicionar integridade de dominio para:
  - `gender`
  - `color`
  - `education`
  - `how_know`
  - `has_report`
  - `type`
  - `resource`
  - `benefit`
  - `shift`
- alinhar `companies` versus `enterprise`
- alinhar `course_load` versus `course_oad`

## Fontes

- `src/adapters/out/orm/*.ts`
- `src/adapters/out/migrations/1775858784315-InitialSchema.ts`
- metadata real consultado em `api_db` via PostgreSQL
