# Esquema do Banco Atual

## Objetivo

Este documento registra o schema atual versionado no repositorio e serve como referencia fiel para:

- tabelas
- colunas
- constraints
- relacionamentos
- responsabilidades de cada tabela

## Fontes auditadas

As informacoes abaixo foram extraidas destes arquivos do projeto:

- `src/adapters/out/migrations/1776384000000-InitialSchema.ts`
- `src/adapters/out/migrations/1776470400000-AddUserCreatedAtAndStudentControlledValues.ts`
- `src/adapters/out/migrations/1776556800000-TrimLegacyContactColumnsAndProtectStudentLists.ts`
- `src/adapters/out/orm/*.ts`
- `src/config/database.config.ts`
- `src/app.module.ts`
- `src/adapters/out/repository/*.ts`
- `src/adapters/out/seeds/seed.ts`

## Importante

Este documento descreve o schema atual resultante da cadeia de migrations presente no repositorio.

Ele nao usa como fonte primaria alguns documentos antigos da pasta `docs`, porque ha arquivos ali que descrevem um estado anterior do banco.

## Resumo executivo

- banco principal esperado: `api_db`
- banco de teste esperado: `api_db_test`
- extensao SQL criada pela migration: `uuid-ossp`
- tabelas de negocio: `15`
- tabela tecnica: `migrations`
- tabela raiz de identidade: `users`
- especializacoes de identidade por PK compartilhada: `admins`, `students`, `companies`
- relacoes `N:N`: `job_skills`, `curriculum_skills`
- `CHECK` constraints de dominio atuais:
  - `ck_users__role`
  - `ck_students__gender`
  - `ck_students__race`
  - `ck_students__education`
  - `ck_students__how_heard`
  - `ck_accessibility_resources__resource`
  - `ck_social_benefits__benefit`

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

## Regras estruturais consolidadas

### Identidade

- `users` guarda credenciais e papel do usuario
- `admins.id`, `students.id` e `companies.id` apontam para `users.id`
- esses tres perfis usam PK compartilhada com `users`

### Contato

- `contacts` e uma tabela separada
- `students.contact_id` e `companies.contact_id` apontam para `contacts.id`
- as duas FKs sao `UNIQUE`, entao cada aluno ou empresa pode apontar para no maximo um contato exclusivo

### Complementos do aluno

- `disabilities` e `1:1` com `students`
- `accessibility_resources` e `1:N` com `students`
- `social_benefits` e `1:N` com `students`
- `curriculum` e `1:1` com `students`, via `student_id UNIQUE`

### Vagas e skills

- `job_openings` pertence a `companies`
- `job_skills` resolve o `N:N` entre `job_openings` e `skills`

### Curriculos e skills

- `curriculum_skills` resolve o `N:N` entre `curriculum` e `skills`

### Cursos presenciais

- `in_person_course_details.course_id` aponta para `courses.id`
- `course_id` e `UNIQUE`, entao o desenho atual e `1:1`

## Inventario detalhado

## `users`

Responsabilidade:

- raiz de autenticacao
- guarda email, senha hash e papel do usuario

Colunas:

| Coluna          | Tipo SQL       | Nulo | Default | Observacoes                          |
| --------------- | -------------- | ---- | ------- | ------------------------------------ |
| `id`            | `uuid`         | nao  | nenhum  | PK; valor e fornecido pela aplicacao |
| `email`         | `varchar(100)` | nao  | nenhum  | unico                                |
| `password_hash` | `varchar(255)` | nao  | nenhum  | senha persistida em formato hash     |
| `role`          | `varchar(20)`  | nao  | nenhum  | limitado por `CHECK`                 |
| `created_at`    | `timestamptz`  | nao  | `now()` | timestamp tecnico de criacao         |

Constraints:

- `pk_users` primary key em `id`
- `uq_users__email` unique em `email`
- `ck_users__role` com valores permitidos: `ADMIN`, `STUDENT`, `COMPANY`

Relacionamentos:

- `admins.id -> users.id` (`ON DELETE CASCADE`)
- `students.id -> users.id` (`ON DELETE CASCADE`)
- `companies.id -> users.id` (`ON DELETE CASCADE`)

Observacoes:

- nao ha `DEFAULT` para `id`; o UUID nasce na aplicacao
- `created_at` foi incluido por migration complementar

## `admins`

Responsabilidade:

- marcar um usuario como perfil administrativo

Colunas:

| Coluna | Tipo SQL | Nulo | Default | Observacoes             |
| ------ | -------- | ---- | ------- | ----------------------- |
| `id`   | `uuid`   | nao  | nenhum  | PK e FK para `users.id` |

Constraints:

- `pk_admins` primary key em `id`
- `fk_admins__id__users` foreign key para `users(id)` com `ON DELETE CASCADE`

Relacionamentos:

- `1:1` com `users`

## `contacts`

Responsabilidade:

- armazenar telefone e endereco
- servir como entidade de contato para `students` e `companies`

Colunas:

| Coluna          | Tipo SQL       | Nulo | Default | Observacoes                         |
| --------------- | -------------- | ---- | ------- | ----------------------------------- |
| `id`            | `uuid`         | nao  | nenhum  | PK; sem geracao automatica no banco |
| `phone`         | `varchar(20)`  | nao  | nenhum  | campo obrigatorio                   |
| `neighbourhood` | `varchar`      | sim  | nenhum  | bairro                              |
| `state`         | `char(2)`      | sim  | nenhum  | UF                                  |
| `city`          | `varchar(100)` | sim  | nenhum  | cidade                              |
| `address`       | `varchar(255)` | sim  | nenhum  | endereco                            |
| `cep`           | `varchar(9)`   | sim  | nenhum  | CEP                                 |
| `complement`    | `varchar(255)` | sim  | nenhum  | complemento                         |

Constraints:

- `pk_contacts` primary key em `id`

Relacionamentos recebidos:

- `students.contact_id -> contacts.id`
- `companies.contact_id -> contacts.id`

Observacoes:

- `name` e `country` foram removidos do schema por migration corretiva
- o contato atual guarda apenas telefone e endereco

## `students`

Responsabilidade:

- perfil de aluno
- dados cadastrais, academicos e de participacao

Colunas:

| Coluna                       | Tipo SQL  | Nulo | Default | Observacoes                            |
| ---------------------------- | --------- | ---- | ------- | -------------------------------------- |
| `id`                         | `uuid`    | nao  | nenhum  | PK e FK para `users.id`                |
| `contact_id`                 | `uuid`    | sim  | nenhum  | FK para `contacts.id`; unico           |
| `cpf`                        | `varchar` | nao  | nenhum  | unico                                  |
| `social_name`                | `varchar` | sim  | nenhum  | nome social                            |
| `date_of_birth`              | `date`    | sim  | nenhum  | data de nascimento                     |
| `gender`                     | `varchar` | sim  | nenhum  | limitado por `CHECK` quando preenchido |
| `gender_other`               | `varchar` | sim  | nenhum  | campo complementar                     |
| `race`                       | `varchar` | sim  | nenhum  | limitado por `CHECK` quando preenchido |
| `education`                  | `varchar` | sim  | nenhum  | limitado por `CHECK` quando preenchido |
| `course_name`                | `varchar` | sim  | nenhum  | curso informado pelo aluno             |
| `institution`                | `varchar` | sim  | nenhum  | instituicao                            |
| `activity_area`              | `varchar` | sim  | nenhum  | area de interesse/atuacao              |
| `has_programming_experience` | `boolean` | sim  | nenhum  | experiencia previa                     |
| `has_technology_course`      | `boolean` | sim  | nenhum  | curso de tecnologia                    |
| `technology_courses_list`    | `text`    | sim  | nenhum  | lista textual de cursos                |
| `send_curriculum`            | `boolean` | nao  | `false` | envio de curriculo                     |
| `motivation`                 | `text`    | sim  | nenhum  | motivacao para o programa              |
| `how_heard`                  | `varchar` | sim  | nenhum  | limitado por `CHECK` quando preenchido |
| `has_computer`               | `boolean` | sim  | nenhum  | possui computador                      |
| `has_internet`               | `boolean` | sim  | nenhum  | possui internet                        |
| `committed_to_participate`   | `boolean` | sim  | nenhum  | compromisso de participacao            |

Constraints:

- `pk_students` primary key em `id`
- `uq_students__contact_id` unique em `contact_id`
- `uq_students__cpf` unique em `cpf`
- `fk_students__id__users` foreign key para `users(id)` com `ON DELETE CASCADE`
- `fk_students__contact_id__contacts` foreign key para `contacts(id)` com `ON DELETE NO ACTION`
- `ck_students__gender`
- `ck_students__race`
- `ck_students__education`
- `ck_students__how_heard`

Relacionamentos:

- `1:1` com `users` por PK compartilhada
- `1:1` opcional com `contacts`
- `1:1` com `disabilities`
- `1:N` com `accessibility_resources`
- `1:N` com `social_benefits`
- `1:1` opcional com `curriculum`

Observacoes:

- no fluxo atual de criacao de aluno, `birthDate`, `gender` e `race` sao obrigatorios no `CreateStudentDto`, mas no banco `date_of_birth`, `gender` e `race` ainda aceitam `NULL`
- `gender`, `race`, `education` e `how_heard` ja possuem `CHECK` para os valores aceitos quando preenchidos
- a obrigatoriedade desses campos ainda esta mais forte na API do que no schema

## `companies`

Responsabilidade:

- perfil de empresa
- dados institucionais e vinculo de contato

Colunas:

| Coluna             | Tipo SQL       | Nulo | Default | Observacoes                  |
| ------------------ | -------------- | ---- | ------- | ---------------------------- |
| `id`               | `uuid`         | nao  | nenhum  | PK e FK para `users.id`      |
| `contact_id`       | `uuid`         | sim  | nenhum  | FK para `contacts.id`; unico |
| `cnpj`             | `varchar(18)`  | nao  | nenhum  | unico                        |
| `name`             | `varchar(100)` | nao  | nenhum  | nome da empresa              |
| `responsible_name` | `varchar(100)` | nao  | nenhum  | nome do responsavel          |

Constraints:

- `pk_companies` primary key em `id`
- `uq_companies__contact_id` unique em `contact_id`
- `uq_companies__cnpj` unique em `cnpj`
- `fk_companies__id__users` foreign key para `users(id)` com `ON DELETE CASCADE`
- `fk_companies__contact_id__contacts` foreign key para `contacts(id)` com `ON DELETE NO ACTION`

Relacionamentos:

- `1:1` com `users` por PK compartilhada
- `1:1` opcional com `contacts`
- `1:N` com `job_openings`

Observacoes:

- assim como em `students`, o repository atual persiste `contacts.name` e `contacts.country` como `null`

## `disabilities`

Responsabilidade:

- complemento `1:1` do aluno para informacoes de deficiencia

Colunas:

| Coluna           | Tipo SQL  | Nulo | Default | Observacoes                |
| ---------------- | --------- | ---- | ------- | -------------------------- |
| `student_id`     | `uuid`    | nao  | nenhum  | PK e FK para `students.id` |
| `has_disability` | `boolean` | nao  | `false` | indicador principal        |
| `description`    | `text`    | sim  | nenhum  | descricao livre            |
| `has_report`     | `varchar` | sim  | nenhum  | texto livre                |
| `type`           | `varchar` | sim  | nenhum  | tipo de deficiencia        |

Constraints:

- `pk_disabilities` primary key em `student_id`
- `fk_disabilities__student_id__students` foreign key para `students(id)` com `ON DELETE CASCADE`

Relacionamentos:

- `1:1` com `students`

Observacoes:

- `has_report` e `type` nao possuem enumeracao no banco

## `accessibility_resources`

Responsabilidade:

- listar recursos de acessibilidade associados a um aluno

Colunas:

| Coluna           | Tipo SQL       | Nulo | Default  | Observacoes                   |
| ---------------- | -------------- | ---- | -------- | ----------------------------- |
| `id`             | `serial`       | nao  | sequence | PK numerica gerada pelo banco |
| `student_id`     | `uuid`         | nao  | nenhum   | FK para `students.id`         |
| `resource`       | `varchar`      | nao  | nenhum   | recurso informado             |
| `resource_other` | `varchar(100)` | sim  | nenhum   | texto complementar            |

Constraints:

- `pk_accessibility_resources` primary key em `id`
- `fk_accessibility_resources__student_id__students` foreign key para `students(id)` com `ON DELETE CASCADE`
- `ck_accessibility_resources__resource`

Indices:

- `ix_accessibility_resources__student_id`

Relacionamentos:

- `N:1` com `students`

Observacoes:

- a aplicacao usa o enum `AccessibilityResourceType`
- o banco possui `CHECK` para limitar os valores de `resource`

## `social_benefits`

Responsabilidade:

- listar beneficios sociais associados a um aluno

Colunas:

| Coluna          | Tipo SQL       | Nulo | Default  | Observacoes                   |
| --------------- | -------------- | ---- | -------- | ----------------------------- |
| `id`            | `serial`       | nao  | sequence | PK numerica gerada pelo banco |
| `student_id`    | `uuid`         | nao  | nenhum   | FK para `students.id`         |
| `benefit`       | `varchar`      | nao  | nenhum   | beneficio informado           |
| `benefit_other` | `varchar(100)` | sim  | nenhum   | texto complementar            |

Constraints:

- `pk_social_benefits` primary key em `id`
- `fk_social_benefits__student_id__students` foreign key para `students(id)` com `ON DELETE CASCADE`
- `ck_social_benefits__benefit`

Indices:

- `ix_social_benefits__student_id`

Relacionamentos:

- `N:1` com `students`

Observacoes:

- a aplicacao usa o enum `SocialBenefitType`
- o banco possui `CHECK` para limitar os valores de `benefit`

## `curriculum`

Responsabilidade:

- guardar o curriculo de um aluno
- centralizar links e disponibilidade do candidato

Colunas:

| Coluna               | Tipo SQL  | Nulo | Default | Observacoes                      |
| -------------------- | --------- | ---- | ------- | -------------------------------- |
| `id`                 | `uuid`    | nao  | nenhum  | PK sem geracao automatica        |
| `is_available`       | `boolean` | nao  | nenhum  | disponibilidade do curriculo     |
| `about`              | `text`    | sim  | nenhum  | resumo                           |
| `linkedin`           | `varchar` | nao  | nenhum  | link obrigatorio no schema atual |
| `github`             | `varchar` | nao  | nenhum  | link obrigatorio no schema atual |
| `profile_photo`      | `varchar` | sim  | nenhum  | foto de perfil                   |
| `video_presentation` | `varchar` | nao  | nenhum  | link de video                    |
| `student_id`         | `uuid`    | sim  | nenhum  | FK para `students.id`; unico     |

Constraints:

- `pk_curriculum` primary key em `id`
- `uq_curriculum__student_id` unique em `student_id`
- `fk_curriculum__student_id__students` foreign key para `students(id)` com `ON DELETE CASCADE`

Relacionamentos:

- `1:1` opcional com `students`
- `N:N` com `skills` via `curriculum_skills`

Observacoes:

- o schema permite `student_id` nulo, mesmo sendo um relacionamento naturalmente dependente de aluno
- essa tabela existe no ORM, na migration e no seed
- hoje ela nao possui controller ou repository dedicados expostos na API

## `skills`

Responsabilidade:

- catalogo reutilizavel de habilidades

Colunas:

| Coluna | Tipo SQL       | Nulo | Default | Observacoes               |
| ------ | -------------- | ---- | ------- | ------------------------- |
| `id`   | `uuid`         | nao  | nenhum  | PK sem geracao automatica |
| `name` | `varchar(100)` | nao  | nenhum  | nome unico da skill       |

Constraints:

- `pk_skills` primary key em `id`
- `uq_skills__name` unique em `name`

Relacionamentos recebidos:

- `job_skills.skill_id -> skills.id`
- `curriculum_skills.skill_id -> skills.id`

## `job_openings`

Responsabilidade:

- armazenar vagas publicadas por empresas

Colunas:

| Coluna             | Tipo SQL       | Nulo | Default              | Observacoes            |
| ------------------ | -------------- | ---- | -------------------- | ---------------------- |
| `id`               | `uuid`         | nao  | `uuid_generate_v4()` | PK gerada pelo banco   |
| `company_id`       | `uuid`         | nao  | nenhum               | FK para `companies.id` |
| `name`             | `varchar`      | nao  | nenhum               | nome da vaga           |
| `description`      | `text`         | sim  | nenhum               | descricao da vaga      |
| `openings_count`   | `integer`      | nao  | `1`                  | quantidade de vagas    |
| `application_link` | `varchar(255)` | sim  | nenhum               | link de candidatura    |
| `is_pcd`           | `boolean`      | nao  | `false`              | vaga afirmativa PCD    |

Constraints:

- `pk_job_openings` primary key em `id`
- `fk_job_openings__company_id__companies` foreign key para `companies(id)` com `ON DELETE CASCADE`

Indices:

- `ix_job_openings__company_id`

Relacionamentos:

- `N:1` com `companies`
- `N:N` com `skills` via `job_skills`

Observacoes:

- essa tabela existe no schema e no seed
- hoje nao ha controller ou repository dedicados para vagas no fluxo HTTP principal

## `job_skills`

Responsabilidade:

- tabela de associacao entre `job_openings` e `skills`

Colunas:

| Coluna     | Tipo SQL | Nulo | Default | Observacoes          |
| ---------- | -------- | ---- | ------- | -------------------- |
| `job_id`   | `uuid`   | nao  | nenhum  | parte da PK composta |
| `skill_id` | `uuid`   | nao  | nenhum  | parte da PK composta |

Constraints:

- `pk_job_skills` primary key composta em (`job_id`, `skill_id`)
- `fk_job_skills__job_id__job_openings` foreign key para `job_openings(id)` com `ON DELETE CASCADE`
- `fk_job_skills__skill_id__skills` foreign key para `skills(id)` com `ON DELETE NO ACTION`

Indices:

- `ix_job_skills__skill_id`

Relacionamentos:

- `N:1` com `job_openings`
- `N:1` com `skills`

## `curriculum_skills`

Responsabilidade:

- tabela de associacao entre `curriculum` e `skills`

Colunas:

| Coluna          | Tipo SQL | Nulo | Default | Observacoes          |
| --------------- | -------- | ---- | ------- | -------------------- |
| `curriculum_id` | `uuid`   | nao  | nenhum  | parte da PK composta |
| `skill_id`      | `uuid`   | nao  | nenhum  | parte da PK composta |

Constraints:

- `pk_curriculum_skills` primary key composta em (`curriculum_id`, `skill_id`)
- `fk_curriculum_skills__curriculum_id__curriculum` foreign key para `curriculum(id)` com `ON DELETE NO ACTION`
- `fk_curriculum_skills__skill_id__skills` foreign key para `skills(id)` com `ON DELETE NO ACTION`

Indices:

- `ix_curriculum_skills__skill_id`

Relacionamentos:

- `N:1` com `curriculum`
- `N:1` com `skills`

## `courses`

Responsabilidade:

- cadastro de cursos da plataforma

Colunas:

| Coluna                | Tipo SQL  | Nulo | Default | Observacoes                 |
| --------------------- | --------- | ---- | ------- | --------------------------- |
| `id`                  | `uuid`    | nao  | nenhum  | PK sem geracao automatica   |
| `name`                | `varchar` | nao  | nenhum  | nome do curso               |
| `banner`              | `varchar` | nao  | nenhum  | URL ou referencia do banner |
| `description`         | `text`    | sim  | nenhum  | descricao opcional          |
| `course_load`         | `varchar` | nao  | nenhum  | carga horaria textual       |
| `start_date`          | `date`    | nao  | nenhum  | inicio do curso             |
| `end_date`            | `date`    | nao  | nenhum  | fim do curso                |
| `start_registrations` | `date`    | nao  | nenhum  | inicio das inscricoes       |
| `end_registrations`   | `date`    | nao  | nenhum  | fim das inscricoes          |
| `link_access`         | `varchar` | nao  | nenhum  | link de acesso              |

Constraints:

- `pk_courses` primary key em `id`

Relacionamentos recebidos:

- `in_person_course_details.course_id -> courses.id`

Observacoes:

- essa tabela esta exposta pela API em `CourseController`
- `course_load` no banco atual e `varchar`, nao inteiro

## `in_person_course_details`

Responsabilidade:

- complemento presencial opcional de um curso

Colunas:

| Coluna       | Tipo SQL  | Nulo | Default | Observacoes                 |
| ------------ | --------- | ---- | ------- | --------------------------- |
| `id`         | `uuid`    | nao  | nenhum  | PK sem geracao automatica   |
| `address`    | `varchar` | nao  | nenhum  | local do curso presencial   |
| `start_date` | `date`    | nao  | nenhum  | data de inicio presencial   |
| `shift`      | `varchar` | nao  | nenhum  | turno                       |
| `room`       | `varchar` | nao  | nenhum  | sala                        |
| `vacancies`  | `integer` | nao  | nenhum  | numero de vagas             |
| `course_id`  | `uuid`    | sim  | nenhum  | FK para `courses.id`; unico |

Constraints:

- `pk_in_person_course_details` primary key em `id`
- `uq_in_person_course_details__course_id` unique em `course_id`
- `fk_in_person_course_details__course_id__courses` foreign key para `courses(id)` com `ON DELETE CASCADE`

Relacionamentos:

- `1:1` opcional com `courses`

Observacoes:

- o schema atual permite `course_id` nulo
- essa tabela existe no ORM, na migration e no seed
- nao ha controller dedicado para esse complemento no fluxo HTTP atual

## `migrations`

Responsabilidade:

- controle tecnico do TypeORM sobre quais migrations ja foram executadas

Colunas:

| Coluna      | Tipo SQL  | Nulo | Default  | Observacoes                 |
| ----------- | --------- | ---- | -------- | --------------------------- |
| `id`        | `serial`  | nao  | sequence | PK tecnica                  |
| `timestamp` | `bigint`  | nao  | nenhum   | timestamp da migration      |
| `name`      | `varchar` | nao  | nenhum   | nome da classe da migration |

Constraints:

- primary key tecnica criada pelo TypeORM

## Relacionamentos consolidados

### Foreign keys

- `admins.id -> users.id`
- `students.id -> users.id`
- `students.contact_id -> contacts.id`
- `companies.id -> users.id`
- `companies.contact_id -> contacts.id`
- `disabilities.student_id -> students.id`
- `accessibility_resources.student_id -> students.id`
- `social_benefits.student_id -> students.id`
- `curriculum.student_id -> students.id`
- `job_openings.company_id -> companies.id`
- `job_skills.job_id -> job_openings.id`
- `job_skills.skill_id -> skills.id`
- `curriculum_skills.curriculum_id -> curriculum.id`
- `curriculum_skills.skill_id -> skills.id`
- `in_person_course_details.course_id -> courses.id`

### Unique keys

- `users.email`
- `skills.name`
- `students.contact_id`
- `students.cpf`
- `companies.contact_id`
- `companies.cnpj`
- `curriculum.student_id`
- `in_person_course_details.course_id`

### Indices adicionais

- `ix_accessibility_resources__student_id`
- `ix_social_benefits__student_id`
- `ix_job_openings__company_id`
- `ix_job_skills__skill_id`
- `ix_curriculum_skills__skill_id`

## O que o banco garante hoje e o que fica na aplicacao

### Garantido diretamente no banco

- unicidade de `users.email`
- unicidade de `students.cpf`
- unicidade de `companies.cnpj`
- unicidade de `skills.name`
- integridade referencial entre as tabelas ligadas por FK
- dominio fechado de `users.role`
- dominio fechado de `students.gender`, `students.race`, `students.education` e `students.how_heard`
- dominio fechado de `accessibility_resources.resource`
- dominio fechado de `social_benefits.benefit`

### Validado pela aplicacao, mas nao fechado no banco

- formato de CPF
- formato de CNPJ
- formato de CEP
- varios campos textuais de `students`

## Exposicao atual pela API

### Tabelas diretamente usadas por controllers e repositories no fluxo principal

- `users`
- `admins`
- `students`
- `companies`
- `contacts`
- `disabilities`
- `accessibility_resources`
- `social_benefits`
- `courses`

### Tabelas presentes no schema, ORM e seed, mas sem controller dedicado hoje

- `curriculum`
- `skills`
- `curriculum_skills`
- `job_openings`
- `job_skills`
- `in_person_course_details`

## Exemplos reais do seed por tabela

Os exemplos abaixo nao sao hipoteticos. Eles sao derivados do `src/adapters/out/seeds/seed.ts`.

### `users`

- `admin@fatilab.com` | `ADMIN`
- `tech@innovatech.com` | `COMPANY`
- `aluno01@fatilab.com` | `STUDENT`

### `companies`

- `InnovaTech Solucoes` | `12.345.678/0001-99` | `Carlos Mendes`
- `Solucoes Digitais Ltda` | `98.765.432/0001-11` | `Fernanda Lima`

### `courses`

- `Desenvolvimento Web Full Stack` | `120h` | `2025-02-01`
- `Ciencia de Dados com Python` | `80h` | `2025-03-01`

### `students`

- `Ana Beatriz Costa` | `design` | `ensino_medio`
- `Bruno Ferreira` | `desenvolvimento` | `superior`
- `Carla Souza` | `dados` | `tecnico`

### `job_openings`

- `Desenvolvedor Frontend` | `2` vagas | `is_pcd=true`
- `Engenheiro DevOps` | `1` vaga | `is_pcd=false`

### `skills`

- `JavaScript`
- `TypeScript`
- `Python`
- `React`
- `Node.js`
- `SQL`

## Observacao final

Se voce alterar qualquer tabela descrita aqui:

1. ajuste a entidade ORM correspondente
2. gere ou crie a migration
3. valide no banco principal
4. valide no banco de teste
5. atualize este documento
