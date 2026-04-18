# Esquema do Banco Atual

## Objetivo

Este documento descreve o schema vigente do projeto com base em:

- migrations versionadas no repositorio
- entidades ORM ativas
- banco validado com `schema:log`
- consulta direta ao `information_schema`

## Fontes auditadas

- `src/adapters/out/migrations/1776384000000-InitialSchema.ts`
- `src/adapters/out/migrations/1776470400000-AddUserCreatedAtAndStudentControlledValues.ts`
- `src/adapters/out/migrations/1776556800000-TrimLegacyContactColumnsAndProtectStudentLists.ts`
- `src/adapters/out/migrations/1776643200000-HardenProfilesAndRemoveStudentGenderOther.ts`
- `src/adapters/out/migrations/1776758400000-RemoveLegacyFields.ts`
- `src/adapters/out/orm/*.ts`
- `src/config/database.config.ts`

## Status da validacao

Validado em `api_db_e2e` com:

- todas as migrations aplicadas
- `npm run typeorm -- schema:log` sem queries pendentes

## Resumo executivo

- banco principal: `api_db`
- banco manual de teste: `api_db_test`
- banco automatizado de E2E: `api_db_e2e`
- extensao usada: `uuid-ossp`
- tabelas de negocio: `15`
- tabela tecnica: `migrations`
- raiz de identidade: `users`
- especializacoes por PK compartilhada: `admins`, `students`, `companies`
- tabelas `N:N`: `job_skills`, `curriculum_skills`

## Campos legados removidos

As colunas abaixo nao existem mais no schema atual:

- `students.social_name`
- `students.course_name`
- `students.technology_courses_list`
- `students.gender_other`
- `social_benefits.benefit_other`
- `accessibility_resources.resource_other`

## CHECK constraints ativas

- `ck_users__role`
- `ck_students__gender`
- `ck_students__race`
- `ck_students__education`
- `ck_students__how_heard`
- `ck_social_benefits__benefit`
- `ck_accessibility_resources__resource`

## Mapa de relacionamentos

```text
users
|- admins
|- students
|  |- contacts
|  |- disabilities
|  |- accessibility_resources
|  |- social_benefits
|  `- curriculum
`- companies
   |- contacts
   `- job_openings
      `- job_skills
         `- skills

curriculum
`- curriculum_skills
   `- skills

courses
`- in_person_course_details
```

## Tabelas

### `users`

Responsabilidade: autenticacao e autorizacao.

Colunas:

- `id uuid not null`
- `email varchar(100) not null`
- `password_hash varchar(255) not null`
- `role varchar(20) not null`
- `created_at timestamptz not null default now()`

Constraints:

- `pk_users`
- `uq_users__email`
- `ck_users__role`

Observacoes:

- `role` aceita `ADMIN`, `STUDENT`, `COMPANY`
- `id` e gerado pela aplicacao

### `admins`

Responsabilidade: especializacao administrativa de `users`.

Colunas:

- `id uuid not null`

Constraints:

- `pk_admins`
- `fk_admins__id__users`

### `contacts`

Responsabilidade: telefone e endereco reutilizados por aluno e empresa.

Colunas:

- `id uuid not null`
- `phone varchar(20) not null`
- `neighbourhood varchar null`
- `state char(2) null`
- `city varchar(100) null`
- `address varchar(255) null`
- `cep varchar(9) null`
- `complement varchar(255) null`

Constraints:

- `pk_contacts`

Observacoes:

- `name` e `country` nao fazem mais parte do schema atual

### `students`

Responsabilidade: perfil de aluno e dados de participacao.

Colunas:

- `id uuid not null`
- `contact_id uuid not null`
- `cpf varchar not null`
- `date_of_birth date not null`
- `gender varchar not null`
- `race varchar not null`
- `education varchar null`
- `institution varchar null`
- `activity_area varchar null`
- `has_programming_experience boolean null`
- `has_technology_course boolean null`
- `send_curriculum boolean not null default false`
- `motivation text null`
- `how_heard varchar null`
- `has_computer boolean null`
- `has_internet boolean null`
- `committed_to_participate boolean null`

Constraints:

- `pk_students`
- `uq_students__contact_id`
- `uq_students__cpf`
- `fk_students__id__users`
- `fk_students__contact_id__contacts`
- `ck_students__gender`
- `ck_students__race`
- `ck_students__education`
- `ck_students__how_heard`

Observacoes:

- `students.contact_id` e obrigatorio e exclusivo
- nao existem mais campos legados de nome social, curso ou lista textual de cursos

### `companies`

Responsabilidade: perfil de empresa.

Colunas:

- `id uuid not null`
- `contact_id uuid not null`
- `cnpj varchar(18) not null`
- `name varchar(100) not null`
- `responsible_name varchar(100) not null`

Constraints:

- `pk_companies`
- `uq_companies__contact_id`
- `uq_companies__cnpj`
- `fk_companies__id__users`
- `fk_companies__contact_id__contacts`

Observacoes:

- `companies.contact_id` tambem e obrigatorio e exclusivo

### `disabilities`

Responsabilidade: complemento `1:1` do aluno para informacoes de deficiencia.

Colunas:

- `student_id uuid not null`
- `has_disability boolean not null default false`
- `description text null`
- `has_report varchar null`
- `type varchar null`

Constraints:

- `pk_disabilities`
- `fk_disabilities__student_id__students`

### `accessibility_resources`

Responsabilidade: recursos de acessibilidade por aluno.

Colunas:

- `id serial not null`
- `student_id uuid not null`
- `resource varchar not null`

Constraints:

- `pk_accessibility_resources`
- `fk_accessibility_resources__student_id__students`
- `ck_accessibility_resources__resource`

Indices:

- `ix_accessibility_resources__student_id`

Valores aceitos em `resource`:

- `Cadeira de rodas`
- `Muletas`
- `Libras`
- `Leitor de tela`
- `Interprete`
- `Outro`

### `social_benefits`

Responsabilidade: beneficios sociais por aluno.

Colunas:

- `id serial not null`
- `student_id uuid not null`
- `benefit varchar not null`

Constraints:

- `pk_social_benefits`
- `fk_social_benefits__student_id__students`
- `ck_social_benefits__benefit`

Indices:

- `ix_social_benefits__student_id`

Valores aceitos em `benefit`:

- `BPC`
- `Bolsa Familia`
- `Auxilio-doenca`
- `Nao recebo`
- `Outro`

### `curriculum`

Responsabilidade: curriculo do aluno.

Colunas:

- `id uuid not null`
- `is_available boolean not null`
- `about text null`
- `linkedin varchar not null`
- `github varchar not null`
- `profile_photo varchar null`
- `video_presentation varchar not null`
- `student_id uuid not null`

Constraints:

- `pk_curriculum`
- `uq_curriculum__student_id`
- `fk_curriculum__student_id__students`

Observacoes:

- o relacionamento com `students` e `1:1` estrito por `student_id unique not null`

### `skills`

Responsabilidade: catalogo de habilidades.

Colunas:

- `id uuid not null`
- `name varchar(100) not null`

Constraints:

- `pk_skills`
- `uq_skills__name`

### `curriculum_skills`

Responsabilidade: associacao `N:N` entre `curriculum` e `skills`.

Colunas:

- `curriculum_id uuid not null`
- `skill_id uuid not null`

Constraints:

- `pk_curriculum_skills`
- `fk_curriculum_skills__curriculum_id__curriculum`
- `fk_curriculum_skills__skill_id__skills`

Indices:

- `ix_curriculum_skills__skill_id`

### `job_openings`

Responsabilidade: vagas publicadas por empresas.

Colunas:

- `id uuid not null default uuid_generate_v4()`
- `company_id uuid not null`
- `name varchar not null`
- `description text null`
- `openings_count integer not null default 1`
- `application_link varchar(255) null`
- `is_pcd boolean not null default false`

Constraints:

- `pk_job_openings`
- `fk_job_openings__company_id__companies`

Indices:

- `ix_job_openings__company_id`

### `job_skills`

Responsabilidade: associacao `N:N` entre `job_openings` e `skills`.

Colunas:

- `job_id uuid not null`
- `skill_id uuid not null`

Constraints:

- `pk_job_skills`
- `fk_job_skills__job_id__job_openings`
- `fk_job_skills__skill_id__skills`

Indices:

- `ix_job_skills__skill_id`

### `courses`

Responsabilidade: catalogo de cursos da plataforma.

Colunas:

- `id uuid not null`
- `name varchar not null`
- `banner varchar not null`
- `description text null`
- `course_load varchar not null`
- `start_date date not null`
- `end_date date not null`
- `start_registrations date not null`
- `end_registrations date not null`
- `link_access varchar not null`

Constraints:

- `pk_courses`

### `in_person_course_details`

Responsabilidade: complemento presencial `1:1` de um curso.

Colunas:

- `id uuid not null`
- `address varchar not null`
- `start_date date not null`
- `shift varchar not null`
- `room varchar not null`
- `vacancies integer not null`
- `course_id uuid not null`

Constraints:

- `pk_in_person_course_details`
- `uq_in_person_course_details__course_id`
- `fk_in_person_course_details__course_id__courses`

Observacoes:

- `course_id` e obrigatorio e exclusivo

### `migrations`

Responsabilidade: controle tecnico do TypeORM.

Colunas:

- `id serial not null`
- `timestamp bigint not null`
- `name varchar not null`

## O que o banco garante hoje

- unicidade de `users.email`
- unicidade de `students.cpf`
- unicidade de `companies.cnpj`
- unicidade de `skills.name`
- integridade referencial das FKs
- dominios fechados para `users.role`
- dominios fechados para `students.gender`, `students.race`, `students.education`, `students.how_heard`
- dominios fechados para `social_benefits.benefit`
- dominios fechados para `accessibility_resources.resource`

## O que continua na aplicacao

- formato de CPF
- formato de CNPJ
- validacoes HTTP de DTO
- regras de negocio que dependem de contexto e nao apenas de estrutura

## Referencias cruzadas

- `docs/modelo-alvo-banco.md`
- `docs/guia-mudancas-no-banco.md`
