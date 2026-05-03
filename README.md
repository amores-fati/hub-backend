# Amores Fati - Backend

API NestJS com PostgreSQL e TypeORM, organizada em arquitetura hexagonal.

## Tecnologias

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Jest e Supertest
- Docker e Docker Compose

## Pre-requisitos

- Node.js 20+
- npm
- Docker com Compose

No PowerShell, se `npm.ps1` for bloqueado, use `npm.cmd`.

## Subida rapida

1. Instale as dependencias:

```bash
npm install
```

2. Revise os arquivos de ambiente:

- `.env` para desenvolvimento principal
- `.env.test` para o banco manual de teste
- `.env.e2e` para o banco automatizado de E2E

3. Suba a stack principal:

```bash
docker compose up -d --build
```

No bootstrap atual da API em Docker, o container executa:

```bash
npm run migration:run
npm run seed:dev
npm run bootstrap:test:dev
npm run start:dev
```

Endpoints locais:

- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/docs`

## Comandos principais

| Comando | Descricao |
| --- | --- |
| `npm run start:dev` | Sobe a API em modo watch na maquina local |
| `npm run build` | Gera o build de producao em `dist/` |
| `npm run test` | Executa a suite unit/test da aplicacao |
| `npm run test:e2e` | Garante `postgres-e2e` ativo e executa a suite E2E em `api_db_e2e` |
| `npm run test:e2e:docker` | Executa a suite E2E em um runner Docker efemero da API |
| `npm run migration:run` | Aplica migrations pendentes |
| `npm run migration:revert` | Reverte a ultima migration |
| `npm run seed:dev` | Popula o banco principal apenas se ele estiver vazio |
| `npm run seed:dev:reset` | Limpa e recria o dataset de desenvolvimento |
| `npm run seed:test:dev` | Popula o banco manual de teste (`api_db_test`) |
| `npm run seed:test:dev:reset` | Limpa e recria o dataset do banco manual de teste |
| `docker compose up -d postgres` | Sobe apenas o banco principal |
| `docker compose up -d postgres-test` | Sobe apenas o banco manual de teste |
| `docker compose --profile e2e up -d postgres-e2e` | Sobe apenas o banco E2E para inspecao manual |

## Ambientes de banco

- `api_db`: banco principal de desenvolvimento, exposto em `localhost:5434`
- `api_db_test`: banco manual de teste, exposto em `localhost:5433`
- `api_db_e2e`: banco automatizado de E2E, exposto em `localhost:5436`

Os tres bancos precisam continuar separados.

## Diagrama do banco (ER)

Diagrama do schema atual em Postgres. Renderiza nativamente no GitHub. Para editar fora do README, copie o bloco para [mermaid.live](https://mermaid.live) ou abra `docs/er-diagram.mmd`.

```mermaid
erDiagram
    USERS ||--o| ADMINS : "is admin"
    USERS ||--o| COMPANIES : "is company"
    USERS ||--o| STUDENTS : "is student"

    STUDENTS ||--|| CONTACTS : "lives at"
    COMPANIES ||--|| CONTACTS : "located at"

    STUDENTS ||--o| DISABILITIES : "declares"
    STUDENTS ||--o{ SOCIAL_BENEFITS : "receives"
    STUDENTS ||--o| CURRICULUM : "owns"

    CURRICULUM ||--o{ CURRICULUM_SKILLS : "lists"
    SKILLS ||--o{ CURRICULUM_SKILLS : "is listed in"

    COURSES ||--o| IN_PERSON_COURSE_DETAILS : "extends"

    COMPANIES ||--o{ JOB_OPENINGS : "publishes"
    JOB_OPENINGS ||--o{ JOB_SKILLS : "requires"
    SKILLS ||--o{ JOB_SKILLS : "is required in"

    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar role
        timestamptz created_at
    }
    ADMINS {
        uuid id PK
    }
    COMPANIES {
        uuid id PK
        varchar cnpj UK
        varchar name
        varchar responsible_name
        uuid contact_id FK
    }
    STUDENTS {
        uuid id PK
        uuid contact_id FK
        varchar cpf UK
        varchar social_name
        date date_of_birth
        varchar gender
        varchar race
        varchar education
        varchar course_name
        varchar institution
        varchar activity_area
        boolean has_programming_experience
        varchar family_income
        text motivation
        varchar how_heard
        boolean has_computer
        boolean has_internet
        boolean committed_to_participate
    }
    CONTACTS {
        uuid id PK
        varchar phone
        varchar neighbourhood
        char state
        varchar city
        varchar address
        varchar cep
        varchar complement
    }
    DISABILITIES {
        uuid student_id PK
        boolean has_disability
        varchar type
    }
    SOCIAL_BENEFITS {
        int id PK
        uuid student_id FK
        varchar benefit
    }
    COURSES {
        uuid id PK
        varchar name
        varchar banner
        text description
        varchar course_load
        date start_date
        date end_date
        date start_registrations
        date end_registrations
        varchar link_access
    }
    IN_PERSON_COURSE_DETAILS {
        uuid id PK
        uuid course_id FK
        varchar address
        date start_date
        varchar shift
        varchar room
        int vacancies
    }
    CURRICULUM {
        uuid id PK
        uuid student_id FK
        boolean is_available
        text about
        varchar linkedin
        varchar github
        varchar profile_photo
        varchar video_presentation
    }
    CURRICULUM_SKILLS {
        uuid curriculum_id PK
        uuid skill_id PK
    }
    SKILLS {
        uuid id PK
        varchar name UK
    }
    JOB_OPENINGS {
        uuid id PK
        uuid company_id FK
        varchar name
        text description
        int openings_count
        varchar application_link
        boolean is_pcd
    }
    JOB_SKILLS {
        uuid job_id PK
        uuid skill_id PK
    }
    SETTINGS {
        uuid id PK
        varchar key UK
        varchar value
    }

## Endpoints Públicos

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/settings/public/:key` | Retorna o valor de uma configuração pública (ex: `whatsapp_phone`) |
```

## E2E

Fluxo local padrao:

```bash
npm run test:e2e
```

Esse script sobe `postgres-e2e` se necessario e roda o Jest apontando para `api_db_e2e`.

Fluxo com runner Docker efemero:

```bash
npm run test:e2e:docker
```

Esse comando sobe `postgres-e2e`, cria um container temporario da `api` e executa os E2E apontando para `postgres-e2e:5432`.

## Reset do banco manual de teste

Se `postgres-test` ficar com volume antigo ou credenciais divergentes:

```bash
docker compose stop postgres-test
docker compose rm -f postgres-test
docker volume rm hub-backend_pgdata_test
npm run bootstrap:test:dev
```

## Dataset do seed de desenvolvimento

Quando o banco principal esta vazio e o seed roda com sucesso, ele cria:

- `1` admin
- `3` empresas
- `5` cursos
- `2` cursos presenciais
- `15` alunos
- `10` skills
- `2` curriculos
- `5` vagas
- `1` configuração de WhatsApp

## Credenciais documentadas

Essas credenciais existem apenas quando o seed de desenvolvimento foi executado.

```text
ADMIN
- admin@fatilab.com | Admin@123

EMPRESAS
- tech@innovatech.com | Empresa@123
- rh@solucoesdigitais.com | Empresa@123
- vagas@nextera.com | Empresa@123

ALUNOS
- aluno01@fatilab.com | Aluno@123
- aluno02@fatilab.com | Aluno@123
- aluno03@fatilab.com | Aluno@123
- aluno04@fatilab.com | Aluno@123
- aluno05@fatilab.com | Aluno@123
- aluno06@fatilab.com | Aluno@123
- aluno07@fatilab.com | Aluno@123
- aluno08@fatilab.com | Aluno@123
- aluno09@fatilab.com | Aluno@123
- aluno10@fatilab.com | Aluno@123
- aluno11@fatilab.com | Aluno@123
- aluno12@fatilab.com | Aluno@123
- aluno13@fatilab.com | Aluno@123
- aluno14@fatilab.com | Aluno@123
- aluno15@fatilab.com | Aluno@123
```

## Referencias

- `docs/arquitetura-de-pastas.md`
- `docs/guia-execucao-e-ambientes.md`
- `docs/guia-mudancas-no-banco.md`
- `docs/esquema-banco-atual.md`
- `docs/modelo-alvo-banco.md`
- `docs/er-diagram.mmd`
