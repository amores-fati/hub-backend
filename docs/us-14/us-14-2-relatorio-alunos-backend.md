# US 14.2 - Relatorio de Alunos Backend

## Objetivo

Implementar no backend o endpoint administrativo que gera o PDF do relatorio de alunos, com suporte aos modos:

- `selected`: exporta alunos especificos por ID
- `all`: exporta todos os alunos que correspondem aos filtros enviados

O endpoint deve retornar um PDF valido com as colunas:

- Nome (+ CPF)
- Curso
- Contato (email + telefone)
- Localizacao
- PCD

## Escopo

Esta implementacao cobre somente backend.

Fora do escopo deste documento:

- integracao da tela de alunos no frontend
- botoes de download
- toast/loading no frontend
- criacao de novos filtros visuais na aplicacao web

## Contexto atual do backend

Ja existe uma implementacao parecida para cursos:

- `src/adapters/in/controllers/admin-reports.controller.ts`
- `src/adapters/in/dtos/reports/export-courses-report.dto.ts`
- `src/core/services/course-report.service.ts`
- `src/core/ports/course-report-pdf-generator.interface.ts`
- `src/adapters/out/pdf/course-report-pdf.generator.ts`
- `test/unit/course-report.service.spec.ts`
- `test/unit/course-report-pdf.generator.spec.ts`
- `test/integration/course-reports.e2e-spec.ts`

A US 14.2 deve seguir o mesmo desenho, evitando criar uma arquitetura paralela.

A listagem atual de alunos ja possui parte das consultas necessarias em:

- `src/adapters/out/repository/student.repository.ts`
- `src/core/ports/student.repository.interface.ts`
- `src/core/services/student.service.ts`
- `src/adapters/in/dtos/student/get-admin-students.dto.ts`

Pontos ja existentes e reaproveitaveis:

- filtro por `search` em nome social, nome completo, email e CPF normalizado
- filtro por cidade/UF via `contact.city` e `contact.state`
- filtro por tipo de deficiencia via `disability.type`
- relacionamento com `enrollments` e `courses`
- exclusao de usuarios removidos via `user.deletedAt IS NULL`
- mascaramento de CPF na listagem de alunos
- `pdfkit` ja instalado no projeto

## Analise do schema e decisoes de negocio

### Relacao aluno x curso

O banco possui dois caminhos relacionados a curso:

- `students.course_name`
- `enrollments.student_id -> enrollments.course_id -> courses.id`

`students.course_name` nao tem FK, e preenchido pelos DTOs de perfil do aluno como dado educacional/declarativo. Exemplos atuais usam valores como `Tecnico em Informatica`, `Computer Science` e `Engineering`. Portanto, ele nao representa matricula em curso do instituto.

A relacao oficial de aluno com curso do instituto e `enrollments`.

Regra de negocio para o relatorio:

- a coluna `Curso` deve usar `courses.name` via `enrollments`
- considerar como curso matriculado somente vinculos `enrollments.type = 'ENROLLMENT'`
- vinculos `INTEREST` nao devem aparecer como curso matriculado
- se o aluno nao tiver `ENROLLMENT`, exibir `-`
- nao usar `students.course_name` como fonte da coluna `Curso`

### Multiplos cursos por aluno

A tabela `enrollments` permite multiplos cursos por aluno, porque a unicidade e por:

```text
student_id + course_id + type
```

A aplicacao tambem lista todos os vinculos do aluno em `GET /courses/me/enrollments`.

Regra de negocio para o relatorio:

- se houver mais de um curso matriculado, exibir todos os cursos na mesma celula
- renderizar um curso por linha dentro da celula sempre que possivel
- ordenar por `enrollments.created_at DESC`, deixando o vinculo mais recente primeiro
- quando houver filtro por curso, a coluna `Curso` deve exibir apenas os cursos matriculados que satisfazem o filtro aplicado

### Status de aluno

Nao existe coluna `students.status`.

O estado ativo/inativo de aluno e representado indiretamente por `users.deleted_at`; alunos com `deleted_at IS NULL` sao os alunos listaveis. Esse criterio ja e usado na listagem administrativa.

O unico status relacional persistido para aluno x curso e `enrollments.type`, com valores:

```text
ENROLLMENT
INTEREST
```

Regra de negocio para o relatorio:

- sempre excluir usuarios soft-deletados com `user.deletedAt IS NULL`
- nao criar coluna `status` em `students` para esta US
- `filters.status` deve ser tratado como status de vinculo com curso, nao status cadastral do aluno
- valores suportados recomendados:
  - `ENROLLMENT`: alunos com ao menos uma matricula
  - `INTEREST`: alunos com ao menos um interesse
  - `NAO_INSCRITO`: alunos sem nenhum registro em `enrollments`
- aceitar aliases de entrada apenas no DTO/service se o frontend precisar, por exemplo `enrolled`, `interested`, `not_enrolled`, `MATRICULADO`, `INTERESSADO`

### PCD

`disabilities.type` e texto livre. Nao ha `CHECK` constraint nem enum no dominio para tipo de deficiencia.

Seeds e DTOs indicam valores variados:

- `visual`
- `auditiva`
- `fisica`
- `intelectual`
- `psicossocial`
- `multipla`
- `TEA`
- `outra`

Regra de negocio para o relatorio:

- nao criar lista controlada no banco nesta US
- manter `disabilities.type` como texto livre
- filtrar `pcdType` com normalizacao de caixa e aliases conhecidos
- exibir `NAO` quando `has_disability` for falso, ausente ou sem tipo
- exibir label normalizado quando houver tipo

Mapa de labels recomendado:

| Valor armazenado/entrada | Label no PDF |
| --- | --- |
| `fisica`, `fisico`, `FISICO` | `FISICO` |
| `visual`, `ocular`, `OCULAR` | `OCULAR` |
| `auditiva`, `auditivo`, `AUDITIVO` | `AUDITIVO` |
| `intelectual` | `INTELECTUAL` |
| `psicossocial` | `PSICOSSOCIAL` |
| `multipla`, `multiplo` | `MULTIPLA` |
| `tea`, `TEA` | `TEA` |
| `outra`, `outro` | `OUTRA` |

Valores desconhecidos devem ser exibidos em uppercase depois de trim, sem quebrar a exportacao.

### Localizacao

A localizacao do aluno vem de `contacts`, via `students.contact_id`.

Campos disponiveis:

- `contacts.city`
- `contacts.state`
- `contacts.address`
- `contacts.neighbourhood`
- `contacts.cep`

Regra de negocio para o relatorio:

- coluna `Localizacao`: exibir `Cidade/UF` quando cidade e UF existirem
- se houver somente cidade, exibir cidade
- se houver somente UF, exibir UF
- se ambos ausentes, exibir `-`
- `filters.location` deve ser texto unico
- se `location` vier no formato `Cidade/UF`, filtrar cidade e UF
- caso contrario, buscar o texto em `contact.city`, `contact.state` e `contact.address`

### Filtro de curso

Regra de negocio para `filters.course`:

- se o valor for UUID, filtrar por `course.id`
- caso contrario, filtrar por `course.name ILIKE`
- o filtro deve considerar somente `enrollments.type = 'ENROLLMENT'`
- nao interpretar `course` como modalidade
- se for necessario filtrar por modalidade no futuro, criar filtro explicito `modality`, alinhado com a listagem atual de alunos

## Contratos HTTP

### Endpoint

```http
POST /api/admin/reports/students
```

Observacao: a aplicacao usa `app.setGlobalPrefix('api')` no `main.ts`, por isso a rota publica final inclui `/api`. Nos testes E2E atuais, o bootstrap nao aplica prefixo global, entao a rota de teste tende a ser `/admin/reports/students`.

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
    course?: string;
    location?: string;
    pcdType?: string;
    status?: string;
  };
}
```

### Response de sucesso

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="relatorio_alunos_AAAA-MM-DD_HHmmss.pdf"
```

O corpo da resposta sera o buffer do PDF.

### Erros esperados

- `400`: `mode="selected"` com `ids` ausente ou vazio
- `400`: filtros invalidos
- `400`: resultado acima de 1000 alunos
- `403`: usuario autenticado sem perfil admin
- `401`: usuario nao autenticado

## Decisoes tecnicas propostas

### Controller

Reaproveitar o controller existente:

```text
src/adapters/in/controllers/admin-reports.controller.ts
```

Adicionar o metodo:

```ts
@Post('students')
async exportStudentsReport(...)
```

Motivo: a rota ja esta agrupada em `@Controller('admin/reports')` e ja exige admin no nivel da classe.

### Service

Criar um service especifico:

```text
src/core/services/student-report.service.ts
```

Responsabilidades:

- validar `mode`
- validar `ids` em modo `selected`
- buscar alunos no repository conforme o modo
- aplicar limite de 1000 registros
- montar dados normalizados para o PDF
- mascarar CPF
- formatar telefone
- formatar valor da coluna PCD
- emitir log seguro antes do processamento e antes da geracao do PDF
- chamar o gerador de PDF
- retornar buffer, filename e count

O service nao deve manipular `Response` do Express.

Contrato sugerido:

```ts
export type StudentReportMode = 'selected' | 'all';

export interface StudentReportFilters {
  search?: string;
  course?: string;
  location?: string;
  pcdType?: string;
  status?: string;
}

export interface GenerateStudentReportCommand {
  mode: StudentReportMode;
  ids?: string[];
  filters?: StudentReportFilters;
  generatedBy: {
    id: string;
    name: string;
  };
}

export interface GeneratedStudentReport {
  filename: string;
  buffer: Buffer;
  count: number;
}
```

### Repository

Alterar:

```text
src/core/ports/student.repository.interface.ts
src/adapters/out/repository/student.repository.ts
```

Adicionar uma projection propria de relatorio para evitar depender da entidade de dominio completa:

```ts
export interface StudentReportProjection {
  id: string;
  email: string;
  cpf: string;
  fullName: string;
  socialName?: string;
  phoneNumber: string;
  city?: string;
  state?: string;
  courseNames: string[];
  hasDisability?: boolean;
  disabilityType?: string;
}
```

Metodos sugeridos no port:

```ts
findManyForReportByIds(ids: string[]): Promise<StudentReportProjection[]>;
findManyForReportByFilters(
  filters?: StudentReportFilters,
): Promise<StudentReportProjection[]>;
```

Base da query:

- `students` como tabela raiz
- `innerJoin` com `user` usando `user.deletedAt IS NULL`
- `leftJoin` com `contact`
- `leftJoin` com `disability`
- `leftJoin` com `enrollment`
- `leftJoin` com `course`

Ordenacao sugerida:

- `student.fullName ASC`

Para `selected`, preservar a ordem dos IDs enviados quando possivel, como foi feito no relatorio de cursos.

### Filtros

#### `search`

Reaproveitar a logica atual:

- `student.socialName ILIKE`
- `student.fullName ILIKE`
- `user.email ILIKE`
- CPF normalizado com `regexp_replace(student.cpf, '\D', '', 'g')`

Observacao de seguranca: quando `search` vier com email, CPF ou telefone, nao logar o valor completo.

#### `course`

Aplicar sobre matriculas reais:

- juntar `enrollments` com `courses`
- exigir `enrollments.type = 'ENROLLMENT'`
- se o valor for UUID, usar `course.id = :courseId`
- caso contrario, usar `course.name ILIKE :course`

Nao usar `students.course_name` e nao interpretar `course` como modalidade.

#### `location`

Aplicar sobre contato do aluno:

- aceitar texto simples
- se vier no formato `Cidade/UF`, aplicar cidade e estado
- caso contrario, buscar em `contact.city`, `contact.state` e `contact.address`
- manter `location` como filtro singular para esta US

#### `pcdType`

Aplicar em:

```sql
disability.has_disability = true
AND disability.type = :pcdType
```

Como `disability.type` e texto livre, normalizar aliases conhecidos antes de consultar. Exemplo: `FISICO` deve encontrar valores como `fisica` e `fisico`.

#### `status`

Nao existe `students.status`. Para esta US, `status` deve ser status de vinculo com curso:

- `ENROLLMENT`: aluno com ao menos uma matricula
- `INTEREST`: aluno com ao menos um interesse
- `NAO_INSCRITO`: aluno sem registros em `enrollments`

Alunos soft-deletados continuam sempre fora do relatorio por `user.deletedAt IS NULL`.

## Dados do PDF

### Coluna Nome

Exibir em duas linhas na mesma celula:

```text
<nome preferencial>
CPF: 123.***.***-00
```

Regra de nome preferencial sugerida:

- usar `socialName` quando existir
- caso contrario, usar `fullName`

CPF nunca deve ser enviado em texto puro ao PDF.

Mascaramento sugerido:

```text
123.***.***-00
```

### Coluna Curso

Origem:

- cursos associados por `enrollments.type = 'ENROLLMENT'`
- exibir `courses.name`
- se nao houver curso matriculado, exibir `-`
- se houver mais de um curso, exibir um por linha na mesma celula
- ordenar cursos por vinculo mais recente primeiro
- nao usar `students.course_name`

### Coluna Contato

Exibir em duas linhas na mesma celula:

```text
email@dominio.com
(11) 98888-8888
```

Telefone deve ser formatado a partir dos digitos:

- 11 digitos: `(11) 98888-8888`
- 10 digitos: `(11) 8888-8888`
- outros formatos: manter valor limpo ou valor original, conforme comportamento desejado

### Coluna Localizacao

Origem recomendada:

```text
contact.city + "/" + contact.state
```

Se cidade e estado ausentes:

```text
-
```

### Coluna PCD

Regra:

- se `hasDisability = true` e `type` existe, exibir tipo formatado
- caso contrario, exibir `NAO`

Formatacao sugerida:

- uppercase
- normalizacao de valores conhecidos
- `fisica`/`fisico` -> `FISICO`
- `visual`/`ocular` -> `OCULAR`
- `auditiva`/`auditivo` -> `AUDITIVO`
- `intelectual` -> `INTELECTUAL`
- `psicossocial` -> `PSICOSSOCIAL`
- `multipla` -> `MULTIPLA`
- `TEA` -> `TEA`
- `outra` -> `OUTRA`

Observacao: o banco atual guarda `disability.type` como texto livre. A implementacao deve normalizar para exibicao e filtro, sem criar migration de enum nesta US.

## Geracao do PDF

Criar port:

```text
src/core/ports/student-report-pdf-generator.interface.ts
```

Contrato sugerido:

```ts
export interface StudentReportPdfRow {
  name: string;
  cpf: string;
  course: string;
  email: string;
  phone: string;
  location: string;
  pcd: string;
}

export interface GenerateStudentReportPdfCommand {
  generatedAt: Date;
  generatedBy: string;
  rows: StudentReportPdfRow[];
}

export interface IStudentReportPdfGenerator {
  generate(command: GenerateStudentReportPdfCommand): Promise<Buffer>;
}
```

Criar adapter:

```text
src/adapters/out/pdf/student-report-pdf.generator.ts
```

Responsabilidades:

- usar `pdfkit`
- gerar buffer PDF
- renderizar cabecalho
- renderizar tabela com 5 colunas
- renderizar rodape em todas as paginas
- suportar quebra de pagina
- suportar celulas multi-linha
- renderizar Nome em destaque e CPF em fonte menor
- renderizar Contato com email e telefone em linhas separadas
- nao acessar banco
- nao conhecer HTTP

Cabecalho sugerido:

```text
Amores Fati
Relatorio de Alunos
Gerado em: DD/MM/AAAA HH:mm
```

Rodape sugerido:

```text
Pagina X de Y
Gerado por: <email do admin>
```

Para facilitar testes de texto no PDF, manter `compress: false`, como o gerador de cursos.

## Filename

Formato:

```text
relatorio_alunos_AAAA-MM-DD_HHmmss.pdf
```

Exemplo:

```text
relatorio_alunos_2026-05-14_153012.pdf
```

## Logging

A demanda pede log antes do processamento e tambem log antes da geracao do PDF.

Implementacao sugerida:

1. Logar recebimento do comando antes da query.
2. Logar geracao antes de chamar o PDF, ja com a contagem real.

Conteudo permitido no log inicial:

```ts
{
  userId,
  mode,
  idsCount,
  filterKeys,
  hasSensitiveSearch
}
```

Conteudo permitido no log antes do PDF:

```ts
{
  userId,
  mode,
  count
}
```

Nao registrar:

- lista de IDs
- CPF completo
- email completo
- telefone completo
- valor completo de `filters.search`
- buffer do PDF

Se for necessario registrar filtros, usar apenas chaves ou valores redigidos:

```ts
{
  filters: {
    search: '[REDACTED]',
    pcdType: 'FISICO'
  }
}
```

Mensagem sugerida:

```text
Received students report request
Generating students report
```

## Limite de registros

Constante no service:

```ts
const STUDENT_REPORT_MAX_ROWS = 1000;
```

Regra:

- se `students.length > 1000`, retornar `400`
- mensagem deve orientar refinamento dos filtros

Mensagem sugerida:

```text
Limite de 1000 alunos excedido. Refine os filtros para exportar o relatorio.
```

## Arquivos a criar

```text
src/adapters/in/dtos/reports/export-students-report.dto.ts
src/adapters/out/pdf/student-report-pdf.generator.ts
src/core/ports/student-report-pdf-generator.interface.ts
src/core/services/student-report.service.ts
test/unit/student-report.service.spec.ts
test/unit/student-report-pdf.generator.spec.ts
test/integration/student-reports.e2e-spec.ts
```

## Arquivos a alterar

```text
src/adapters/in/controllers/admin-reports.controller.ts
src/adapters/out/repository/student.repository.ts
src/app.module.ts
src/core/ports/student.repository.interface.ts
```

## Plano de acao

1. Criar DTO `ExportStudentsReportDto`.
2. Criar port `IStudentReportPdfGenerator`.
3. Criar projection e metodos de relatorio em `IStudentRepository`.
4. Implementar queries de relatorio no `StudentRepository`.
5. Criar `StudentReportService`.
6. Implementar mascaramento de CPF no service, sem reutilizar retorno paginado da tela.
7. Implementar formatacao de telefone.
8. Implementar normalizacao da coluna PCD e aliases de filtro.
9. Implementar regras de `course`, `location` e `status` conforme schema atual.
10. Implementar `StudentReportPdfGenerator`.
11. Adicionar `POST /admin/reports/students` no `AdminReportsController`.
12. Registrar service e generator no `AppModule`.
13. Criar testes unitarios do service.
14. Criar testes unitarios do PDF generator.
15. Criar testes E2E principais.
16. Rodar build, lint e testes.

## Testes unitarios sugeridos

### `student-report.service.spec.ts`

Cenarios:

- `selected` com IDs retorna PDF e count correto
- `selected` com lista vazia retorna erro
- `all` sem filtros busca todos
- `all` com `pcdType=FISICO` repassa filtro ao repository
- limite acima de 1000 retorna erro
- CPF completo nunca e enviado para o generator
- telefone `11988888888` vira `(11) 98888-8888`
- PCD com tipo `FISICO` vira label esperado
- PCD sem deficiencia vira `NAO`
- log inicial nao contem CPF/email/telefone completos
- log ocorre antes da geracao do PDF

### `student-report-pdf.generator.spec.ts`

Cenarios:

- gera PDF valido iniciado por `%PDF`
- PDF contem nome do aluno
- PDF contem CPF mascarado
- PDF nao contem CPF puro
- PDF contem email e telefone formatado
- PDF contem PCD `NAO`
- PDF contem PCD com tipo

## Testes E2E sugeridos

Criar:

```text
test/integration/student-reports.e2e-spec.ts
```

Cenarios:

- admin autenticado exporta selected com 3 alunos
- admin autenticado exporta all sem filtros
- admin autenticado exporta all com `pcdType=FISICO`
- aluno autenticado recebe `403`
- `selected` com `ids=[]` recebe `400`
- response tem `Content-Type: application/pdf`
- response tem `Content-Disposition` com `relatorio_alunos_AAAA-MM-DD_HHmmss.pdf`
- PDF nao contem CPF completo
- limite acima de 1000 retorna `400`

Observacao: para validar texto no PDF, seguir a estrategia do teste de cursos, convertendo o buffer para `latin1` e procurando os fragmentos hexadecimais quando necessario.

## Criterio de pronto backend

O backend estara pronto quando:

- endpoint `POST /api/admin/reports/students` existir
- endpoint exigir admin
- modo `selected` funcionar com IDs especificos
- modo `selected` rejeitar lista vazia
- modo `all` funcionar sem filtros
- modo `all` funcionar com filtros definidos
- limite de 1000 alunos retornar `400`
- response enviar `Content-Type: application/pdf`
- response enviar `Content-Disposition: attachment`
- filename seguir `relatorio_alunos_AAAA-MM-DD_HHmmss.pdf`
- PDF tiver as 5 colunas exigidas
- CPF aparecer somente mascarado
- contato aparecer com email e telefone em linhas separadas
- PCD aparecer como tipo ou `NAO`
- logs nao tiverem CPF/email/telefone completos
- testes unitarios principais passarem
- teste E2E principal passar

## Decisoes fechadas apos analise

1. A coluna `Curso` usa `enrollments.course.name` com `type = 'ENROLLMENT'`.
2. `students.course_name` e dado de perfil/educacao e nao entra no relatorio como curso matriculado.
3. Multiplos cursos devem aparecer todos, um por linha, ordenados pelo vinculo mais recente.
4. `filters.course` recebe UUID de curso ou texto para buscar em `course.name`; nao representa modalidade.
5. `filters.location` recebe texto unico; `Cidade/UF` recebe tratamento especial.
6. `filters.status` representa status de vinculo: `ENROLLMENT`, `INTEREST` ou `NAO_INSCRITO`.
7. Alunos soft-deletados nunca entram no relatorio.
8. PCD continua texto livre no banco, com normalizacao para filtro e exibicao no PDF.
