# US 14.1 - Relatorio de Cursos Backend

## Objetivo

Implementar no backend o endpoint administrativo que gera o PDF do relatorio de cursos, com suporte aos modos:

- `selected`: exporta cursos especificos por ID
- `all`: exporta a lista completa ou filtrada

O endpoint deve retornar um PDF valido com as colunas:

- Nome
- Modalidade
- Endereco
- Status
- Data Inicial
- Data Final

## Escopo

Esta implementacao cobre somente backend.

Fora do escopo deste documento:

- integracao da tela de cursos no frontend
- botoes de download
- toast/loading no frontend
- alteracoes visuais da aplicacao web

## Contratos HTTP

### Endpoint

```http
POST /api/admin/reports/courses
```

Observacao: a aplicacao usa `app.setGlobalPrefix('api')`, por isso a rota publica final inclui `/api`.

### Autorizacao

A rota deve ser protegida com:

```ts
@RequireAuth(UserRoleEnum.ADMIN)
```

Usuarios autenticados sem perfil admin devem receber `403`.

### Body

```ts
{
  mode: 'selected' | 'all';
  ids?: string[];
  filters?: {
    search?: string;
    modality?: string;
    status?: 'ATIVO' | 'INATIVO';
    startDate?: string;
    endDate?: string;
  };
}
```

### Response de sucesso

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="relatorio_cursos_AAAA-MM-DD_HHmmss.pdf"
```

O corpo da resposta sera o buffer do PDF.

### Erros esperados

- `400`: `mode="selected"` com `ids` ausente ou vazio
- `400`: filtros invalidos
- `400`: resultado acima de 1000 cursos
- `403`: usuario autenticado sem perfil admin
- `401`: usuario nao autenticado

## Decisao sobre status de curso

O campo `status` sera persistido no banco, com valores permitidos:

```ts
ATIVO | INATIVO
```

Ele nao sera derivado por data. Isso permite que um admin desative manualmente um curso mesmo que ele esteja dentro do periodo de inicio/fim.

## Migration

### Arquivo

Criar uma migration em:

```text
src/adapters/out/migrations/<timestamp>-AddStatusToCourses.ts
```

Sugestao de nome:

```text
1778600000000-AddStatusToCourses.ts
```

O timestamp final deve respeitar a sequencia real das migrations do projeto no momento da implementacao.

### Responsabilidade

Adicionar a coluna `status` na tabela `courses`, com default `ATIVO` para preservar compatibilidade com registros existentes.

### SQL esperado

```sql
ALTER TABLE "courses"
ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'ATIVO';

ALTER TABLE "courses"
ADD CONSTRAINT "ck_courses__status"
CHECK ("status" IN ('ATIVO', 'INATIVO'));
```

### Down esperado

```sql
ALTER TABLE "courses"
DROP CONSTRAINT "ck_courses__status";

ALTER TABLE "courses"
DROP COLUMN "status";
```

### Boas praticas da migration

- nao usar `synchronize`
- manter `up()` e `down()` reversiveis
- usar nome explicito para a constraint
- garantir default para nao quebrar dados existentes
- revisar com `schema:log` apos aplicar

## Responsabilidades por camada

### `src/core/domain`

Responsavel pelas regras essenciais do dominio.

Alteracoes:

- adicionar `CourseStatus`
- adicionar `status` na entidade `Course`
- validar que o status seja `ATIVO` ou `INATIVO`
- expor getter `status`
- incluir `status` no `toJSON()`

Arquivo sugerido para enum:

```text
src/core/domain/course-status.enum.ts
```

Ou, se o projeto preferir manter simples, o enum pode ficar no mesmo arquivo de `Course` enquanto houver baixo acoplamento.

### `src/core/command`

Responsavel pelos contratos internos de entrada do core.

Alteracoes:

- adicionar `status?: CourseStatus` em `CreateCourseCommand`, se a criacao de curso passar a aceitar status
- se ausente, service ou dominio deve assumir `ATIVO`

Arquivo:

```text
src/core/command/course.command.ts
```

### `src/core/ports`

Responsavel pelos contratos que o core espera dos adapters externos.

Alteracoes:

- criar tipo de filtros de relatorio/listagem de cursos
- adicionar metodos ao `ICourseRepository` para buscar cursos por IDs e por filtros

Contrato sugerido:

```ts
export interface CourseReportFilters {
  search?: string;
  modality?: string;
  status?: CourseStatus;
  startDate?: string;
  endDate?: string;
}

export interface CourseWithLocation {
  course: Course;
  location: string | null;
}

export interface ICourseRepository {
  create(course: Course): Promise<Course>;
  findAll(): Promise<Course[]>;
  findAllWithLocation(): Promise<CourseWithLocation[]>;
  findById(id: string): Promise<Course | null>;
  findManyByIdsWithLocation(ids: string[]): Promise<CourseWithLocation[]>;
  findManyWithLocationByFilters(
    filters?: CourseReportFilters,
  ): Promise<CourseWithLocation[]>;
}
```

Observacao: evitar criar ports extras se o relatorio puder usar `ICourseRepository` sem misturar responsabilidades.

### `src/core/services`

Responsavel por orquestrar regras de aplicacao, sem conhecer HTTP ou TypeORM.

Criar service especifico:

```text
src/core/services/course-report.service.ts
```

Responsabilidades:

- validar `mode`
- validar `ids` em modo `selected`
- buscar cursos no repository conforme o modo
- aplicar limite de 1000 registros
- montar dados normalizados para o PDF
- chamar o gerador de PDF
- retornar buffer e filename

O service nao deve manipular `Response` do Express.

Contrato sugerido:

```ts
export interface GenerateCourseReportCommand {
  mode: 'selected' | 'all';
  ids?: string[];
  filters?: CourseReportFilters;
  generatedBy: {
    id: string;
    name: string;
  };
}

export interface GeneratedCourseReport {
  filename: string;
  buffer: Buffer;
  count: number;
}
```

Observacao: como o usuario autenticado hoje nao tem nome, usar `email` como identificador no rodape ate que o modelo de admin tenha nome.

### `src/adapters/out/orm`

Responsavel pelo mapeamento TypeORM.

Alterar:

```text
src/adapters/out/orm/course.orm-entity.ts
```

Adicionar:

```ts
@Column({ name: 'status', type: 'varchar', length: 20, default: 'ATIVO' })
status: CourseStatus;
```

Se for usado `@Check`, manter o nome alinhado com a migration:

```ts
@Check('ck_courses__status', `"status" IN ('ATIVO', 'INATIVO')`)
```

### `src/adapters/out/repository`

Responsavel por transformar filtros em query de banco e mapear ORM para dominio.

Alterar:

```text
src/adapters/out/repository/course.repository.ts
```

Responsabilidades novas:

- mapear `status` ORM -> dominio
- mapear `status` dominio -> ORM
- implementar busca por IDs com endereco
- implementar busca por filtros com endereco
- manter ordenacao consistente, preferencialmente `createdAt DESC`

Filtros em modo `all`:

- `search`: `course.name ILIKE %search%`
- `modality`: igualdade em `course.modality`
- `status`: igualdade em `course.status`
- `startDate`: `course.startDate >= startDate`
- `endDate`: `course.endDate <= endDate`

Endereco:

- buscar `in_person_course_details.address`
- quando nao existir ou estiver vazio, o PDF deve exibir `-`

### `src/adapters/out/pdf`

Responsavel apenas pela geracao fisica do PDF.

Criar:

```text
src/adapters/out/pdf/course-report-pdf.generator.ts
```

Responsabilidades:

- receber dados ja normalizados
- gerar PDF em buffer
- renderizar cabecalho
- renderizar tabela
- renderizar rodape em todas as paginas
- nao acessar banco
- nao conhecer HTTP

Lib recomendada:

```text
pdfkit
```

Motivo:

- simples para gerar PDF server-side
- suporta streaming/buffer
- permite controlar paginas, tabela, cabecalho e rodape sem framework pesado

Dependencias esperadas:

```text
pdfkit
@types/pdfkit
```

### `src/adapters/in/dtos`

Responsavel por validar entrada HTTP.

Criar:

```text
src/adapters/in/dtos/reports/export-courses-report.dto.ts
```

Validacoes:

- `mode` deve ser `selected` ou `all`
- `ids` deve ser array de UUIDs quando informado
- `filters.status` deve ser `ATIVO` ou `INATIVO`
- `filters.startDate` e `filters.endDate` devem ser datas validas
- `filters` opcional

Observacao: a regra "selected exige ids com ao menos 1 item" deve ficar no service tambem, porque e regra de caso de uso, nao apenas detalhe HTTP.

### `src/adapters/in/controllers`

Responsavel por HTTP, auth, headers e status code.

Criar:

```text
src/adapters/in/controllers/admin-reports.controller.ts
```

Responsabilidades:

- declarar rota `POST /admin/reports/courses`
- exigir admin
- receber DTO
- obter usuario autenticado com `@CurrentUser()`
- chamar `CourseReportService`
- setar headers de PDF
- enviar buffer

Exemplo de retorno:

```ts
res.setHeader('Content-Type', 'application/pdf');
res.setHeader(
  'Content-Disposition',
  `attachment; filename="${report.filename}"`,
);
return res.send(report.buffer);
```

### `src/app.module.ts`

Responsavel por registrar controllers e providers.

Alteracoes:

- registrar `AdminReportsController`
- registrar `CourseReportService`
- registrar `CourseReportPdfGenerator`
- manter injecao via providers existentes quando possivel
- evitar modulo novo se isso aumentar complexidade sem ganho imediato

## Geracao do PDF

### Cabecalho

Primeira pagina deve exibir:

- marca textual `Amores Fati`
- titulo `Relatorio de Cursos`
- data/hora de geracao

Observacao: nao existe asset de logo no backend atualmente. Para cumprir a intencao sem adicionar arquivo binario agora, usar marca textual `Amores Fati`. Se um logo oficial for adicionado depois, o generator pode trocar o texto por imagem.

### Tabela

Colunas:

| Coluna | Origem |
| --- | --- |
| Nome | `course.name` |
| Modalidade | `course.modality` |
| Endereco | `location` ou `-` |
| Status | `course.status` |
| Data Inicial | `course.startDate` formatada |
| Data Final | `course.endDate` formatada |

### Datas

Formatar em pt-BR:

```text
DD/MM/AAAA
```

Implementacao simples:

```ts
new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
}).format(date);
```

Usar `UTC` evita deslocamento de data ao formatar campos SQL `date`.

### Filename

Formato:

```text
relatorio_cursos_AAAA-MM-DD_HHmmss.pdf
```

Exemplo:

```text
relatorio_cursos_2026-05-11_174530.pdf
```

### Rodape

Cada pagina deve conter:

```text
Pagina X de Y
Gerado por: <email do admin>
```

Enquanto o modelo de admin nao tiver nome, o email e o identificador disponivel e auditavel.

## Logging

O log deve ser emitido depois da busca e antes da geracao do PDF, porque nesse momento ja existe a quantidade real.

Conteudo permitido:

```ts
{
  userId,
  mode,
  count
}
```

Nao registrar:

- lista de IDs
- conteudo completo dos filtros
- dados pessoais
- buffer do PDF

Mensagem sugerida:

```text
Generating courses report
```

## Limite de registros

Constante no service:

```ts
const COURSE_REPORT_MAX_ROWS = 1000;
```

Regra:

- se `courses.length > 1000`, retornar `400`
- mensagem deve orientar refinamento dos filtros

Mensagem sugerida:

```text
Limite de 1000 cursos excedido. Refine os filtros para exportar o relatorio.
```

## Arquivos a criar

```text
src/adapters/in/controllers/admin-reports.controller.ts
src/adapters/in/dtos/reports/export-courses-report.dto.ts
src/adapters/out/pdf/course-report-pdf.generator.ts
src/adapters/out/migrations/<timestamp>-AddStatusToCourses.ts
src/core/services/course-report.service.ts
```

Opcional, se o enum ficar separado:

```text
src/core/domain/course-status.enum.ts
```

## Arquivos a alterar

```text
package.json
package-lock.json
src/app.module.ts
src/core/domain/course.entity.ts
src/core/command/course.command.ts
src/core/ports/course.repository.interface.ts
src/core/services/course.service.ts
src/adapters/out/orm/course.orm-entity.ts
src/adapters/out/repository/course.repository.ts
src/adapters/in/dtos/course/create-course.dto.ts
src/adapters/in/dtos/course/course-response.dto.ts
```

Observacao: `course.service.ts`, `create-course.dto.ts` e `course-response.dto.ts` so devem ser alterados se a criacao/listagem de cursos tambem precisar expor ou aceitar `status`. Para o relatorio, o minimo obrigatorio e dominio, ORM, repository, migration e service de relatorio.

## Testes

### Unitarios

Criar testes para:

```text
test/unit/course-report.service.spec.ts
test/unit/course-report-pdf.generator.spec.ts
```

Cenarios:

- `selected` com IDs retorna PDF e count correto
- `selected` com lista vazia retorna erro
- `all` sem filtros busca todos
- `all` com `status=ATIVO` repassa filtro ao repository
- limite acima de 1000 retorna erro
- endereco vazio vira `-`
- data `2026-02-23` vira `23/02/2026`
- log ocorre antes da geracao do PDF

### E2E

Criar ou ampliar suite de integracao:

```text
test/integration/course-reports.e2e-spec.ts
```

Cenarios:

- admin autenticado exporta selected com sucesso
- admin autenticado exporta all sem filtros
- admin autenticado exporta all com `status=ATIVO`
- aluno autenticado recebe `403`
- response tem `Content-Type: application/pdf`
- response tem `Content-Disposition` com filename correto

## Fluxo de implementacao

1. Criar enum/contrato de status.
2. Ajustar dominio `Course`.
3. Ajustar ORM `CourseOrmEntity`.
4. Criar migration `AddStatusToCourses`.
5. Atualizar repository com filtros e busca por IDs.
6. Criar DTO do endpoint.
7. Criar generator de PDF.
8. Criar `CourseReportService`.
9. Criar controller `AdminReportsController`.
10. Registrar providers/controllers no `AppModule`.
11. Adicionar testes unitarios.
12. Adicionar teste E2E principal.
13. Rodar build, lint e testes.
14. Validar `schema:log` apos migration.

## Principios de implementacao

- manter regra de negocio fora do controller
- manter TypeORM fora do core
- nao criar modulo novo sem necessidade
- nao duplicar logica de filtros entre service e repository
- nao criar abstracao generica de relatorios agora
- nao adicionar dependencia pesada para PDF sem necessidade
- validar entrada com DTO e regra de caso de uso no service
- manter mensagens de erro claras para o frontend
- evitar dados sensiveis em logs
- garantir migration reversivel

## Criterio de pronto backend

O backend estara pronto quando:

- `courses.status` existir no banco com `ATIVO` e `INATIVO`
- endpoint `POST /api/admin/reports/courses` existir
- endpoint exigir admin
- modo `selected` funcionar com IDs especificos
- modo `all` funcionar com filtros opcionais
- filtro `status` consultar a coluna real
- PDF tiver as 6 colunas exigidas
- endereco vazio aparecer como `-`
- datas aparecerem em `DD/MM/AAAA`
- response enviar headers de PDF e attachment
- limite de 1000 registros retornar `400`
- log for emitido antes da geracao do PDF
- testes unitarios e E2E principais passarem
