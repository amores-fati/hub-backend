# US 14.3 - Relatorio de Vagas Backend

## Objetivo

Implementar no backend o endpoint administrativo que gera o PDF do relatorio de vagas de emprego, com suporte aos modos:

- `selected`: exporta vagas especificas por ID
- `all`: exporta todas as vagas que correspondem aos filtros enviados

O endpoint deve retornar um PDF valido com as colunas:

- Nome
- Numero de Vagas
- Exclusivo PCD
- Data de Anuncio

## Escopo

Esta implementacao cobre somente backend.

Fora do escopo deste documento:

- integracao da tela de vagas no frontend
- botoes de download
- toast/loading no frontend
- alteracoes visuais da aplicacao web

## Conclusao da analise

A implementacao faz sentido no backend atual, mas existe um bloqueio de schema para cumprir a US corretamente:

- a tabela `job_openings` existe
- a entidade ORM `JobOpeningOrmEntity` existe
- o seed cria vagas em `job_openings`
- a coluna `is_pcd` existe e atende a coluna `Exclusivo PCD`
- a coluna `openings_count` existe e atende a coluna `Numero de Vagas`
- a coluna `name` existe e atende a coluna `Nome`
- nao existe coluna de data de anuncio
- nao existe `created_at` em `job_openings`
- nao existe `announcement_date` ou `announcementDate`
- nao existe repository/service/controller de vagas hoje

Portanto, para atender o criterio "Data de Anuncio formatada em DD/MM/AAAA" e o teste com `announcementDate=2026-04-23`, e necessario criar uma migration adicionando uma data de anuncio.

Decisao recomendada:

- adicionar `announcement_date date NOT NULL DEFAULT CURRENT_DATE` em `job_openings`
- mapear no ORM como `announcementDate`
- filtrar `dateFrom` e `dateTo` sobre `announcement_date`
- formatar `announcementDate` em `DD/MM/AAAA` no PDF

Motivo: `announcement_date` e um campo de negocio da vaga. Usar `created_at` como substituto nao existe hoje e ainda misturaria auditoria tecnica com data de anuncio.

## Contexto atual do backend

Ja existem implementacoes parecidas para cursos e alunos:

- `src/adapters/in/controllers/admin-reports.controller.ts`
- `src/adapters/in/dtos/reports/export-courses-report.dto.ts`
- `src/adapters/in/dtos/reports/export-students-report.dto.ts`
- `src/core/services/course-report.service.ts`
- `src/core/services/student-report.service.ts`
- `src/adapters/out/pdf/course-report-pdf.generator.ts`
- `src/adapters/out/pdf/student-report-pdf.generator.ts`
- `test/integration/course-reports.e2e-spec.ts`
- `test/integration/student-reports.e2e-spec.ts`

A US 14.3 deve seguir o mesmo desenho.

Pontos existentes para vagas:

- `src/adapters/out/orm/job-opening.orm-entity.ts`
- `src/adapters/out/orm/job-skill.orm-entity.ts`
- `src/adapters/out/seeds/seed.ts`
- migration inicial cria `job_openings`
- `JobOpeningOrmEntity` esta em `ORM_ENTITIES` no `database.config.ts`

Ponto de atencao:

- `JobOpeningOrmEntity` nao esta hoje em `TypeOrmModule.forFeature([...])` no `AppModule`; sera necessario registrar para injetar repository TypeORM no adapter de relatorio.

## Contratos HTTP

### Endpoint

```http
POST /api/admin/reports/vacancies
```

Observacao: a aplicacao usa `app.setGlobalPrefix('api')` no `main.ts`, por isso a rota publica final inclui `/api`. Nos testes E2E atuais, o bootstrap nao aplica prefixo global, entao a rota de teste tende a ser `/admin/reports/vacancies`.

### Autorizacao

A rota deve ser protegida com:

```ts
@RequireAuth(UserRoleEnum.ADMIN)
```

Como `AdminReportsController` ja usa `@RequireAuth(UserRoleEnum.ADMIN)` no nivel da classe, adicionar o metodo neste controller reaproveita a protecao.

Usuarios autenticados sem perfil admin devem receber `403`.

### Body

```ts
{
  mode: 'selected' | 'all';
  ids?: string[];
  filters?: {
    search?: string;
    isPcd?: boolean;
    dateFrom?: string;
    dateTo?: string;
  };
}
```

### Response de sucesso

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="relatorio_vagas_AAAA-MM-DD_HHmmss.pdf"
```

O corpo da resposta sera o buffer do PDF.

### Erros esperados

- `400`: `mode="selected"` com `ids` ausente ou vazio
- `400`: filtros invalidos
- `400`: resultado acima de 1000 vagas
- `403`: usuario autenticado sem perfil admin
- `401`: usuario nao autenticado

## Analise do schema e decisoes de negocio

### Tabela `job_openings`

Schema atual pela migration inicial:

```sql
CREATE TABLE "job_openings" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "company_id" uuid NOT NULL,
  "name" character varying NOT NULL,
  "description" text,
  "openings_count" integer NOT NULL DEFAULT 1,
  "application_link" character varying(255),
  "is_pcd" boolean NOT NULL DEFAULT false,
  CONSTRAINT "pk_job_openings" PRIMARY KEY ("id")
)
```

Relacao:

```text
companies 1:N job_openings
job_openings N:N skills via job_skills
```

### Coluna Data de Anuncio

Nao ha campo de data no schema atual de vagas.

Regra de negocio proposta:

- `announcement_date` representa a data em que a vaga foi anunciada/publicada
- para registros existentes, usar `CURRENT_DATE` no backfill
- novas vagas devem receber `announcementDate` automaticamente com a data atual quando nao informado
- o relatorio usa `announcement_date`, nao `application_link`, `company`, nem `id`

### Coluna Exclusivo PCD

Origem:

```text
job_openings.is_pcd
```

Regra:

- `true` -> `SIM`
- `false` -> `NÃO`

O PDF deve renderizar texto simples, nao badge.

### Coluna Numero de Vagas

Origem:

```text
job_openings.openings_count
```

Regra:

- exibir como inteiro
- alinhar ao centro no PDF
- se o banco tiver valor nulo por drift antigo, normalizar para `0` ou rejeitar na query; pelo schema atual o campo e `NOT NULL DEFAULT 1`

### Filtro `search`

Regra proposta:

- buscar em `job_openings.name ILIKE %search%`
- opcionalmente buscar em `job_openings.description ILIKE %search%`

Decisao recomendada:

- incluir `description` no search, porque e conteudo textual da vaga e nao sensivel
- nao buscar por empresa nesta US, a menos que o frontend ja envie esse valor no campo search

### Filtro `isPcd`

Regra:

- se `isPcd` for `true`, filtrar `job_openings.is_pcd = true`
- se `isPcd` for `false`, filtrar `job_openings.is_pcd = false`
- se ausente, nao aplicar filtro

Importante: nao usar `if (filters.isPcd)` porque isso ignora `false`. Usar `typeof filters.isPcd === 'boolean'`.

### Filtros `dateFrom` e `dateTo`

Regra:

- `dateFrom`: `announcement_date >= dateFrom`
- `dateTo`: `announcement_date <= dateTo`
- datas devem ser validadas como ISO date string no DTO
- formatacao no PDF deve usar `pt-BR` com `timeZone: 'UTC'` para evitar deslocamento de data

### Ordenacao

Regra recomendada:

- modo `all`: `announcement_date DESC`, depois `name ASC`
- modo `selected`: preservar a ordem dos IDs enviados sempre que possivel

## Migration obrigatoria

### Arquivo

Criar migration em:

```text
src/adapters/out/migrations/<timestamp>-AddAnnouncementDateToJobOpenings.ts
```

Sugestao de nome:

```text
1778700000000-AddAnnouncementDateToJobOpenings.ts
```

O timestamp final deve respeitar a sequencia real das migrations do projeto no momento da implementacao.

### Responsabilidade

Adicionar `announcement_date` na tabela `job_openings`.

SQL esperado:

```sql
ALTER TABLE "job_openings"
ADD COLUMN "announcement_date" date NOT NULL DEFAULT CURRENT_DATE;
```

Down esperado:

```sql
ALTER TABLE "job_openings"
DROP COLUMN "announcement_date";
```

### ORM

Alterar:

```text
src/adapters/out/orm/job-opening.orm-entity.ts
```

Adicionar:

```ts
@Column({
  name: 'announcement_date',
  type: 'date',
  default: () => 'CURRENT_DATE',
})
announcementDate: Date;
```

Se necessario, usar transformer de date-only no mesmo padrao de `StudentOrmEntity` para evitar deslocamento.

## Responsabilidades por camada

### `src/core/ports`

Como nao existe repository de vagas hoje, criar um port especifico de relatorio:

```text
src/core/ports/vacancy-report.repository.interface.ts
```

Contrato sugerido:

```ts
export const IVacancyReportRepository = Symbol('IVacancyReportRepository');

export interface VacancyReportFilters {
  search?: string;
  isPcd?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface VacancyReportProjection {
  id: string;
  name: string;
  openingsCount: number;
  isPcd: boolean;
  announcementDate: Date;
}

export interface IVacancyReportRepository {
  findManyByIds(ids: string[]): Promise<VacancyReportProjection[]>;
  findManyByFilters(
    filters?: VacancyReportFilters,
  ): Promise<VacancyReportProjection[]>;
}
```

Motivo: nao existe agregado de dominio de vaga implementado. Criar um port especifico evita inventar um CRUD completo de vagas apenas para o relatorio.

### `src/adapters/out/repository`

Criar:

```text
src/adapters/out/repository/vacancy-report.repository.ts
```

Responsabilidades:

- consultar `JobOpeningOrmEntity`
- implementar busca por IDs
- implementar filtros `search`, `isPcd`, `dateFrom`, `dateTo`
- preservar ordem dos IDs no modo `selected`
- ordenar modo `all` por `announcementDate DESC`, `name ASC`
- retornar projection simples

### `src/core/ports`

Criar port do generator:

```text
src/core/ports/vacancy-report-pdf-generator.interface.ts
```

Contrato sugerido:

```ts
export const IVacancyReportPdfGenerator = Symbol(
  'IVacancyReportPdfGenerator',
);

export interface VacancyReportPdfRow {
  name: string;
  openingsCount: string;
  isPcd: string;
  announcementDate: string;
}

export interface GenerateVacancyReportPdfCommand {
  generatedAt: Date;
  generatedBy: string;
  rows: VacancyReportPdfRow[];
}

export interface IVacancyReportPdfGenerator {
  generate(command: GenerateVacancyReportPdfCommand): Promise<Buffer>;
}
```

### `src/core/services`

Criar:

```text
src/core/services/vacancy-report.service.ts
```

Responsabilidades:

- validar `mode`
- validar `ids` em modo `selected`
- buscar vagas no repository conforme modo
- aplicar limite de 1000 registros
- montar rows normalizadas para PDF
- formatar `isPcd` como `SIM`/`NÃO`
- formatar `announcementDate` como `DD/MM/AAAA`
- emitir log antes da geracao do PDF com `userId`, `mode` e `count`
- chamar o gerador de PDF
- retornar buffer, filename e count

Contrato sugerido:

```ts
export type VacancyReportMode = 'selected' | 'all';

export const VACANCY_REPORT_MAX_ROWS = 1000;

export interface GenerateVacancyReportCommand {
  mode: VacancyReportMode;
  ids?: string[];
  filters?: VacancyReportFilters;
  generatedBy: {
    id: string;
    name: string;
  };
}

export interface GeneratedVacancyReport {
  filename: string;
  buffer: Buffer;
  count: number;
}
```

### `src/adapters/out/pdf`

Criar:

```text
src/adapters/out/pdf/vacancy-report-pdf.generator.ts
```

Responsabilidades:

- usar `pdfkit`
- gerar PDF em buffer
- renderizar cabecalho
- renderizar tabela com 4 colunas
- centralizar coluna `Numero de Vagas`
- renderizar `SIM`/`NÃO` como texto simples
- renderizar rodape em todas as paginas
- suportar quebra de pagina
- nao acessar banco
- nao conhecer HTTP

Colunas sugeridas:

| Coluna | Origem | Formatacao |
| --- | --- | --- |
| Nome | `job_openings.name` | texto |
| Numero de Vagas | `openings_count` | inteiro centralizado |
| Exclusivo PCD | `is_pcd` | `SIM` ou `NÃO` |
| Data de Anuncio | `announcement_date` | `DD/MM/AAAA` |

### `src/adapters/in/dtos`

Criar:

```text
src/adapters/in/dtos/reports/export-vacancies-report.dto.ts
```

Validacoes:

- `mode` deve ser `selected` ou `all`
- `ids` deve ser array de UUIDs quando informado
- `filters.search` string opcional
- `filters.isPcd` boolean opcional
- `filters.dateFrom` date string opcional
- `filters.dateTo` date string opcional

Observacao: a regra "selected exige ids com ao menos 1 item" deve ficar no service tambem, porque e regra do caso de uso.

### `src/adapters/in/controllers`

Alterar:

```text
src/adapters/in/controllers/admin-reports.controller.ts
```

Adicionar:

```ts
@Post('vacancies')
async exportVacanciesReport(...)
```

Responsabilidades:

- receber DTO
- obter usuario autenticado com `@CurrentUser()`
- chamar `VacancyReportService`
- traduzir `DomainException` para `BadRequestException`
- setar headers de PDF
- enviar buffer

### `src/app.module.ts`

Alteracoes:

- adicionar `JobOpeningOrmEntity` em `TypeOrmModule.forFeature`
- registrar `VacancyReportRepository`
- registrar `VacancyReportService`
- registrar `VacancyReportPdfGenerator`
- registrar tokens `IVacancyReportRepository` e `IVacancyReportPdfGenerator`

## Geracao do PDF

### Cabecalho

Primeira pagina deve exibir:

- `Amores Fati`
- `Relatorio de Vagas`
- data/hora de geracao

### Tabela

Colunas:

```text
Nome | Numero de Vagas | Exclusivo PCD | Data de Anuncio
```

Regras visuais:

- `Numero de Vagas` centralizado
- `Exclusivo PCD` como texto simples (`SIM`/`NÃO`)
- `Data de Anuncio` em `DD/MM/AAAA`

### Filename

Formato:

```text
relatorio_vagas_AAAA-MM-DD_HHmmss.pdf
```

Exemplo:

```text
relatorio_vagas_2026-05-14_153012.pdf
```

### Rodape

Cada pagina deve conter:

```text
Pagina X de Y
Gerado por: <email do admin>
```

## Logging

A demanda pede log antes do processamento. Para manter o mesmo padrao da US 14.1/14.2 e atender o criterio "com userId, mode e quantidade", o log com quantidade deve acontecer depois da busca e antes da geracao do PDF.

Mensagem sugerida:

```text
Generating vacancies report
```

Conteudo permitido:

```ts
{
  userId,
  mode,
  count
}
```

Se for necessario logar recebimento da requisicao antes da query, usar somente metadados seguros:

```ts
{
  userId,
  mode,
  idsCount,
  filterKeys
}
```

Nao registrar:

- lista de IDs
- buffer do PDF
- filtros completos se futuramente tiverem dados sensiveis

## Limite de registros

Constante no service:

```ts
const VACANCY_REPORT_MAX_ROWS = 1000;
```

Regra:

- se `vacancies.length > 1000`, retornar `400`
- mensagem deve orientar refinamento dos filtros

Mensagem sugerida:

```text
Limite de 1000 vagas excedido. Refine os filtros para exportar o relatorio.
```

## Arquivos a criar

```text
src/adapters/in/dtos/reports/export-vacancies-report.dto.ts
src/adapters/out/migrations/<timestamp>-AddAnnouncementDateToJobOpenings.ts
src/adapters/out/pdf/vacancy-report-pdf.generator.ts
src/adapters/out/repository/vacancy-report.repository.ts
src/core/ports/vacancy-report-pdf-generator.interface.ts
src/core/ports/vacancy-report.repository.interface.ts
src/core/services/vacancy-report.service.ts
test/unit/vacancy-report.service.spec.ts
test/unit/vacancy-report-pdf.generator.spec.ts
test/unit/vacancy-report.repository.spec.ts
test/integration/vacancy-reports.e2e-spec.ts
```

## Arquivos a alterar

```text
src/adapters/in/controllers/admin-reports.controller.ts
src/adapters/out/orm/job-opening.orm-entity.ts
src/adapters/out/seeds/seed.ts
src/app.module.ts
```

Opcional, mas recomendado apos a implementation:

```text
docs/esquema-banco-atual.md
docs/modelo-alvo-banco.md
docs/er-diagram.dbml
docs/er-diagram.mmd
```

## Plano de acao

1. Criar migration `AddAnnouncementDateToJobOpenings`.
2. Ajustar `JobOpeningOrmEntity` com `announcementDate`.
3. Atualizar seed de vagas com datas explicitas.
4. Criar DTO `ExportVacanciesReportDto`.
5. Criar port `IVacancyReportRepository`.
6. Criar repository `VacancyReportRepository`.
7. Criar port `IVacancyReportPdfGenerator`.
8. Criar `VacancyReportPdfGenerator`.
9. Criar `VacancyReportService`.
10. Adicionar `POST /admin/reports/vacancies` no `AdminReportsController`.
11. Registrar providers e `JobOpeningOrmEntity` no `AppModule`.
12. Criar testes unitarios do service.
13. Criar testes unitarios do PDF generator.
14. Criar testes unitarios do repository.
15. Criar E2E principal.
16. Rodar build, lint e testes.
17. Validar `schema:log` apos migration.

## Testes unitarios sugeridos

### `vacancy-report.service.spec.ts`

Cenarios:

- `selected` com IDs retorna PDF e count correto
- `selected` com lista vazia retorna erro
- `all` sem filtros busca todas as vagas
- `all` com `isPcd=true` repassa filtro ao repository
- limite acima de 1000 retorna erro
- `isPcd=true` vira `SIM`
- `isPcd=false` vira `NÃO`
- `announcementDate=2026-04-23` vira `23/04/2026`
- log ocorre antes da geracao do PDF
- filename segue `relatorio_vagas_AAAA-MM-DD_HHmmss.pdf`

### `vacancy-report-pdf.generator.spec.ts`

Cenarios:

- gera PDF valido iniciado por `%PDF`
- PDF contem nome da vaga
- PDF contem numero de vagas
- PDF contem `SIM`
- PDF contem `NÃO`
- PDF contem data formatada

### `vacancy-report.repository.spec.ts`

Cenarios:

- `findManyByIds` filtra por IDs e preserva ordem enviada
- `findManyByFilters` aplica `search`
- `findManyByFilters` aplica `isPcd=true`
- `findManyByFilters` aplica `isPcd=false`
- `findManyByFilters` aplica `dateFrom`
- `findManyByFilters` aplica `dateTo`

## Testes E2E sugeridos

Criar:

```text
test/integration/vacancy-reports.e2e-spec.ts
```

Cenarios:

- admin autenticado exporta selected com 3 vagas
- admin autenticado exporta all com `isPcd=true`
- PDF contem `SIM` para vaga PCD
- PDF contem `NÃO` para vaga nao PCD
- PDF contem data `23/04/2026`
- `selected` com `ids=[]` recebe `400`
- limite acima de 1000 recebe `400`
- aluno autenticado recebe `403`
- response tem `Content-Type: application/pdf`
- response tem `Content-Disposition` com `relatorio_vagas_AAAA-MM-DD_HHmmss.pdf`

## Criterio de pronto backend

O backend estara pronto quando:

- `job_openings.announcement_date` existir no banco
- `JobOpeningOrmEntity` expuser `announcementDate`
- endpoint `POST /api/admin/reports/vacancies` existir
- endpoint exigir admin
- modo `selected` funcionar com IDs especificos
- modo `selected` rejeitar lista vazia
- modo `all` funcionar sem filtros
- modo `all` funcionar com filtros `search`, `isPcd`, `dateFrom`, `dateTo`
- PDF tiver as 4 colunas exigidas
- `Numero de Vagas` aparecer como inteiro centralizado
- `Exclusivo PCD` aparecer como `SIM` ou `NÃO`
- `Data de Anuncio` aparecer em `DD/MM/AAAA`
- response enviar headers de PDF e attachment
- limite de 1000 registros retornar `400`
- log for emitido antes da geracao do PDF
- testes unitarios principais passarem
- teste E2E principal passar

## Riscos e observacoes

- Sem migration de `announcement_date`, a US nao consegue cumprir os criterios de data.
- Como nao ha CRUD/domain de vagas implementado, a solucao mais enxuta e criar repository especifico de relatorio.
- `JobOpeningOrmEntity` precisa entrar no `TypeOrmModule.forFeature`; hoje ele so esta no metadata global do TypeORM.
- Se o frontend ja usa outro nome para data da vaga, alinhar antes da implementacao. Pelo texto da US, o nome tecnico esperado e `announcementDate`.
