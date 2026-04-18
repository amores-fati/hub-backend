# Modelo-Alvo do Banco

## Objetivo

Este documento nao descreve apenas o que existe hoje. Ele define o **padrao recomendado** para evoluir o banco com foco em:

- robustez relacional
- nomes consistentes
- constraints explicitas
- integridade de dados no proprio banco
- facilidade de manutencao em TypeORM e PostgreSQL

## Principios de Modelagem

- O banco deve ser a fonte de verdade da integridade estrutural.
- Regras importantes de dominio devem existir tambem no banco, nao so na aplicacao.
- Relacionamentos `1:1`, `1:N` e `N:N` devem ficar evidentes nas constraints.
- Nomes devem ser previsiveis e padronizados.
- O schema deve evitar ambiguidade, duplicidade de significado e colunas com papeis misturados.

## Convencoes de Nomenclatura

### Tabelas

- usar `snake_case`
- usar nomes em ingles para manter alinhamento com o codigo
- preferir plural para tabelas de agregados e catalogos

Padrao recomendado:

- `users`
- `admins`
- `contacts`
- `students`
- `disabilities`
- `accessibility_resources`
- `social_benefits`
- `companies`
- `job_openings`
- `curriculum`
- `skills`
- `curriculum_skills`
- `job_skills`
- `courses`
- `in_person_course_details`

### Colunas

- PK sempre `id`, exceto tabelas de associacao ou PK compartilhada intencional
- FK sempre `<entidade_singular>_id`
- booleanos com prefixo `is_`, `has_`, `can_`, `should_`
- datas sem horario: `date`
- data/hora de auditoria: `timestamptz`
- evitar camelCase no banco

Exemplos recomendados:

- `contact_id`
- `company_id`
- `student_id`
- `created_at`
- `updated_at`
- `deleted_at`
- `is_available`
- `has_programming_experience`

### Constraints

Padrao recomendado:

- PK: `pk_<table>`
- UNIQUE: `uq_<table>__<coluna_1>__<coluna_2>`
- FK: `fk_<table>__<coluna>__<tabela_referenciada>`
- CHECK: `ck_<table>__<regra>`
- INDEX: `ix_<table>__<coluna_1>__<coluna_2>`

Exemplos:

- `pk_users`
- `uq_users__email`
- `uq_students__cpf`
- `fk_students__id__users`
- `fk_students__contact_id__contacts`
- `ck_users__role`
- `ix_job_openings__company_id`

## Regras Estruturais Recomendadas

### 1. `users` deve ser a raiz de identidade

Melhor pratica recomendada:

- `users` concentra autenticacao e autorizacao
- `admins`, `students` e `companies` sao especializacoes de `users`
- especializacoes usam **PK compartilhada** com `users.id`

Modelo:

- `admins.id -> users.id`
- `students.id -> users.id`
- `companies.id -> users.id`

### 2. `contacts` deve ser entidade separada

Melhor pratica recomendada:

- `contacts` nao deve ser subtipo de `users`
- `contacts` representa dados de contato/endereco
- `students` e `companies` referenciam `contacts`

Modelo:

- `students.contact_id -> contacts.id`
- `companies.contact_id -> contacts.id`

Se o contato for exclusivo por entidade:

- `UNIQUE(students.contact_id)`
- `UNIQUE(companies.contact_id)`

### 3. `students` e `companies` sao perfis, nao contas independentes

Isso evita:

- duplicidade de identidade
- usuario sem perfil claro
- ligacoes confusas entre `user`, `contact` e perfis

### 4. `1:1` so quando houver dependencia forte

Usar `1:1` quando:

- o registro filho nao faz sentido sem o pai
- existe no maximo um filho por pai

Exemplos corretos:

- `students` -> `disabilities`
- `students` -> `curriculum`
- `courses` -> `in_person_course_details` se for realmente extensao unica do curso

### 5. `1:N` deve usar FK no lado filho

Exemplos corretos:

- `companies 1:N job_openings`
- `students 1:N accessibility_resources`
- `students 1:N social_benefits`

### 6. `N:N` deve ser resolvido com tabela de associacao

Exemplos:

- `curriculum_skills`
- `job_skills`

As tabelas de associacao devem ter:

- PK composta pelas duas FKs
- FKs nomeadas
- indices secundarios quando a consulta inversa for frequente

## Modelo Recomendado por Entidade

### `users`

Responsabilidade:

- identidade
- login
- autorizacao

Campos recomendados:

- `id uuid primary key`
- `email citext not null`
- `password_hash varchar(255) not null`
- `role varchar(20) not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints recomendadas:

- `pk_users`
- `uq_users__email`
- `ck_users__role`

Recomendacoes:

- usar `citext` ou unique index em `lower(email)`
- renomear `password` para `password_hash`
- manter `role` explicito no banco

### `admins`

Campos recomendados:

- `id uuid primary key`

Constraints:

- `pk_admins`
- `fk_admins__id__users`

Relacionamento:

- `admins 1:1 users`

### `contacts`

Campos recomendados:

- `id uuid primary key`
- `name varchar(255) not null`
- `phone varchar(20) not null`
- `country varchar(100) null`
- `state char(2) null`
- `city varchar(100) null`
- `address varchar(255) null`
- `cep varchar(9) null`
- `complement varchar(255) null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- `pk_contacts`

### `students`

Campos recomendados:

- `id uuid primary key`
- `contact_id uuid null`
- `cpf varchar(11) not null`
- `social_name varchar(255) null`
- `date_of_birth date not null`
- `gender varchar(30) not null`
- `gender_other varchar(100) null`
- `race varchar(30) not null`
- `education varchar(40) null`
- `course varchar(255) null`
- `institution varchar(255) null`
- `area_activity varchar(255) null`
- `has_programming_experience boolean null`
- `has_technology_course boolean null`
- `which_courses text null`
- `send_curriculum boolean not null`
- `motivation text null`
- `how_know varchar(40) null`
- `has_computer boolean null`
- `has_internet boolean null`
- `can_commit boolean null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- `pk_students`
- `fk_students__id__users`
- `fk_students__contact_id__contacts`
- `uq_students__cpf`
- `uq_students__contact_id` se o contato for exclusivo
- `ck_students__gender`
- `ck_students__race`
- `ck_students__education`
- `ck_students__how_know`

Relacionamentos:

- `students 1:1 users`
- `students 1:1 contacts` se `contact_id` for unico
- `students 1:1 disabilities`
- `students 1:1 curriculum`
- `students 1:N accessibility_resources`
- `students 1:N social_benefits`

### `disabilities`

Modelo recomendado:

- PK compartilhada com `students`

Campos:

- `student_id uuid primary key`
- `has_disability boolean not null`
- `description text null`
- `has_report varchar(30) null`
- `type varchar(30) null`

Constraints:

- `pk_disabilities`
- `fk_disabilities__student_id__students`
- `ck_disabilities__has_report`
- `ck_disabilities__type`

### `accessibility_resources`

Se o sistema ja usa UUID em quase tudo, o ideal e padronizar:

- `id uuid primary key`
- `student_id uuid not null`
- `resource varchar(40) not null`
- `resource_other varchar(100) null`

Constraints:

- `pk_accessibility_resources`
- `fk_accessibility_resources__student_id__students`
- `ck_accessibility_resources__resource`
- `ix_accessibility_resources__student_id`

Relacionamento:

- `students 1:N accessibility_resources`

### `social_benefits`

Campos:

- `id uuid primary key`
- `student_id uuid not null`
- `benefit varchar(40) not null`
- `benefit_other varchar(100) null`

Constraints:

- `pk_social_benefits`
- `fk_social_benefits__student_id__students`
- `ck_social_benefits__benefit`
- `ix_social_benefits__student_id`

Relacionamento:

- `students 1:N social_benefits`

### `companies`

Campos recomendados:

- `id uuid primary key`
- `contact_id uuid null`
- `cnpj varchar(14) not null`
- `name varchar(255) not null`
- `responsible_name varchar(100) not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- `pk_companies`
- `fk_companies__id__users`
- `fk_companies__contact_id__contacts`
- `uq_companies__cnpj`
- `uq_companies__contact_id` se o contato for exclusivo

Relacionamentos:

- `companies 1:1 users`
- `companies 1:1 contacts` se `contact_id` for unico
- `companies 1:N job_openings`

### `job_openings`

Nome recomendado:

- usar `job_openings` em vez de `jobs` se o registro representar uma vaga publicada

Campos:

- `id uuid primary key`
- `company_id uuid not null`
- `name varchar(255) not null`
- `description text null`
- `jobs_number integer not null default 1`
- `application_link varchar(255) null`
- `is_pcd boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- `pk_job_openings`
- `fk_job_openings__company_id__companies`
- `ix_job_openings__company_id`

Relacionamentos:

- `companies 1:N job_openings`
- `job_openings N:N skills`

Decisao importante:

- **nao** usar `job_openings.id -> companies.id`
- isso destruiria a cardinalidade correta

### `curriculum`

Nome recomendado:

- `curriculum` como nome canonico da tabela

Duas opcoes validas:

1. PK propria + `student_id UNIQUE`
2. PK compartilhada com `students`

Recomendacao:

- usar PK compartilhada se o curriculo for exatamente um por aluno e nao existir sem o aluno

Campos:

- `student_id uuid primary key`
- `is_available boolean not null`
- `about text null`
- `linkedin varchar(255) null`
- `github varchar(255) null`
- `profile_photo varchar(255) null`
- `video_presentation varchar(255) null`
- `updated_at timestamptz not null default now()`

Constraints:

- `pk_curriculum`
- `fk_curriculum__student_id__students`

Relacionamentos:

- `students 1:1 curriculum`
- `curriculum N:N skills`

### `skills`

Campos:

- `id uuid primary key`
- `name varchar(100) not null`

Constraints:

- `pk_skills`
- `uq_skills__name`

### `curriculum_skills`

Campos:

- `curriculum_id uuid not null`
- `skill_id uuid not null`

Constraints:

- `pk_curriculum_skills`
- `fk_curriculum_skills__curriculum_id__curriculum`
- `fk_curriculum_skills__skill_id__skills`
- `ix_curriculum_skills__skill_id`

Relacionamento:

- `curriculum N:N skills`

### `courses`

Campos recomendados:

- `id uuid primary key`
- `name varchar(255) not null`
- `banner varchar(255) not null`
- `description text null`
- `course_load integer not null`
- `start_date date null`
- `end_date date null`
- `start_registrations date null`
- `end_registrations date null`
- `link_access varchar(255) not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- `pk_courses`

### `in_person_course_details`

Nome recomendado:

- substituir `person_courses`

Se for extensao `1:1` do curso:

- usar PK compartilhada

Campos:

- `course_id uuid primary key`
- `address varchar(255) not null`
- `start_date date not null`
- `shift varchar(20) not null`
- `room varchar(50) null`
- `vacancies integer not null`

Constraints:

- `pk_in_person_course_details`
- `fk_in_person_course_details__course_id__courses`
- `ck_in_person_course_details__shift`

Relacionamento:

- `courses 1:1 in_person_course_details`

## Regras de Integridade Recomendadas

### Unicidade

Implementar:

- `users.email` unico
- `students.cpf` unico
- `companies.cnpj` unico
- `skills.name` unico

### Dominios fechados

Usar `CHECK` ou enum de banco para:

- `users.role`
- `students.gender`
- `students.race`
- `students.education`
- `students.how_know`
- `disabilities.has_report`
- `disabilities.type`
- `accessibility_resources.resource`
- `social_benefits.benefit`
- `in_person_course_details.shift`

### Indices

Criar indices em:

- todas as FKs que nao sejam PK ou UNIQUE
- colunas usadas em busca e login

Indices recomendados:

- `uq_users__email` ou `uq_users__email_lower`
- `uq_students__cpf`
- `uq_companies__cnpj`
- `ix_job_openings__company_id`
- `ix_accessibility_resources__student_id`
- `ix_social_benefits__student_id`
- `ix_curriculum_skills__skill_id`
- `ix_job_skills__skill_id`

## Decisoes de Padronizacao Recomendadas

### Manter

- `users` como raiz
- `students` e `companies` como perfis especializados
- `contacts` como entidade separada
- `companies 1:N job_openings`

### Renomear

- `curriculums` -> `curriculum`
- `jobs` -> `job_openings`
- `skills_job` -> `job_skills`
- `skills_curriculum` -> `curriculum_skills`
- `person_courses` -> `in_person_course_details`
- `ownerName` -> `responsible_name`
- `adress` -> `address`
- `video_apresentation` -> `video_presentation`
- `is_avaliable` -> `is_available`
- `tecnology_course` -> `has_technology_course`
- `compromisse` -> `can_commit`

### Revisar

- `contacts.name`
- `contacts.country`
- `users.role`
- `password` -> `password_hash`
- `course_load` tipo `integer`

## Estrategia de Evolucao

Nao fazer tudo numa migration so.

Ordem recomendada:

1. padronizar nomes de constraints
2. adicionar unicidade de chaves naturais
3. corrigir nomes de colunas com erro
4. corrigir nullability conforme regra de negocio
5. introduzir `CHECK` constraints
6. renomear tabelas de associacao e tabelas mal nomeadas
7. avaliar mudancas estruturais maiores como PK compartilhada em `curriculum` e `in_person_course_details`

## Decisao Arquitetural Recomendada

Se a meta e ter um banco robusto e limpo, o melhor caminho e:

- definir um **modelo-alvo**
- aplicar migrations pequenas e reversiveis
- corrigir nomes e constraints antes de crescer o schema
- evitar deixar a integridade apenas na camada NestJS/TypeScript

Este documento deve ser tratado como a referencia para as proximas migrations.
