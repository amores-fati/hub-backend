# Modelo-Alvo do Banco

## Objetivo

Este documento define o alvo recomendado para evoluir o banco a partir do estado atual, sem reintroduzir legados e sem perder alinhamento com o TypeORM.

Para o schema vigente, use `docs/esquema-banco-atual.md`.

## Principios

- o banco deve proteger a integridade estrutural
- regras de dominio importantes devem existir tambem em constraints
- nomes de tabelas, colunas, FKs e indices devem ser previsiveis
- migrations, ORM e banco real precisam permanecer sincronizados
- campos removidos por limpeza de legado nao devem voltar

## Convencoes

### Tabelas

- usar `snake_case`
- usar ingles
- manter nomes ja consolidados no repositorio

Tabelas canonicas:

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

- PK simples: `id`
- FK: `<entidade>_id`
- booleanos com `is_` ou `has_`
- datas sem horario: `date`
- auditoria: `created_at`, `updated_at`

### Constraints

Padrao recomendado:

- `pk_<table>`
- `uq_<table>__<coluna>`
- `fk_<table>__<coluna>__<tabela_ref>`
- `ck_<table>__<regra>`
- `ix_<table>__<coluna>`

## Estrutura que deve ser preservada

### Identidade

- `users` como raiz de autenticacao
- `admins`, `students` e `companies` como especializacoes por PK compartilhada
- `users.role` mantido e protegido por `CHECK`

### Contato

- `contacts` como entidade separada
- `students.contact_id` e `companies.contact_id` obrigatorios e unicos

### Perfil de aluno

- manter `students` sem colunas legadas de nome social, curso textual ou complemento de genero
- manter `disabilities` como `1:1`
- manter `accessibility_resources` e `social_benefits` como `1:N`

### Empresas e vagas

- manter `companies 1:N job_openings`
- nao acoplar PK de vaga ao ID da empresa

### Curriculo e cursos presenciais

- manter `curriculum` com `student_id unique not null`
- manter `in_person_course_details` com `course_id unique not null`

## Campos que nao devem voltar

Nao reintroduzir no schema nem no dominio:

- `students.social_name`
- `students.course_name`
- `students.technology_courses_list`
- `students.gender_other`
- `social_benefits.benefit_other`
- `accessibility_resources.resource_other`

## Melhorias futuras recomendadas

### Auditoria

Considerar `updated_at` em tabelas de agregados principais:

- `users`
- `students`
- `companies`
- `courses`
- `job_openings`
- `curriculum`

### Email

Avaliar um dos dois caminhos:

- `citext` em `users.email`
- unique index em `lower(email)`

### Constraints ainda faltantes

O schema atual ja esta consistente, mas ainda vale avaliar:

- `CHECK` para `disabilities.has_report`
- `CHECK` para `disabilities.type`, se o dominio fechar essa lista
- `CHECK` para `in_person_course_details.shift`, se o dominio fechar turnos

### Chaves tecnicas de tabelas auxiliares

Hoje `accessibility_resources` e `social_benefits` usam `serial`.

Se surgir necessidade de distribuicao, replicacao ou padronizacao completa em UUID, essa migracao pode ser considerada, mas nao e obrigatoria para o estado atual.

## Modelo recomendado por agregado

### `users`

Manter:

- `id uuid`
- `email`
- `password_hash`
- `role`
- `created_at`

### `students`

Manter:

- `id`
- `contact_id`
- `cpf`
- `date_of_birth`
- `gender`
- `race`
- `education`
- `institution`
- `activity_area`
- flags de participacao e infraestrutura

### `companies`

Manter:

- `id`
- `contact_id`
- `cnpj`
- `name`
- `responsible_name`

### `job_openings`

Manter:

- `id`
- `company_id`
- `name`
- `description`
- `openings_count`
- `application_link`
- `is_pcd`

### `curriculum`

Manter:

- `id`
- `student_id`
- `is_available`
- `about`
- `linkedin`
- `github`
- `profile_photo`
- `video_presentation`

### `courses`

Manter:

- `id`
- `name`
- `banner`
- `description`
- `course_load`
- `start_date`
- `end_date`
- `start_registrations`
- `end_registrations`
- `link_access`

## Processo recomendado para evoluir o modelo

1. ajustar ORM
2. gerar ou escrever migration
3. aplicar no banco local
4. validar com `npm run typeorm -- schema:log`
5. rodar `npm run test -- --runInBand`
6. rodar `npm run test:e2e`
7. atualizar docs

## Referencias

- `docs/esquema-banco-atual.md`
- `docs/guia-mudancas-no-banco.md`
