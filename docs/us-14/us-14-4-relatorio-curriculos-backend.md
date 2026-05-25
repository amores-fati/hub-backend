# US 14.4 - Relatorio de Curriculos Backend

## Objetivo

Implementar o endpoint administrativo que gera PDF com curriculos cadastrados, suportando:

- `selected`: exporta curriculos especificos por ID
- `all`: exporta curriculos que correspondem aos filtros enviados

O PDF deve conter as colunas:

- Aluno (nome + CPF mascarado)
- Area de Interesse
- Preferencia
- Status

## Escopo

Esta implementacao cobre somente backend:

- rota HTTP
- DTO
- query no banco
- geracao de PDF
- logging seguro
- limite de 1000 registros
- testes unitarios e E2E

Fora de escopo:

- integracao com frontend
- tela/listagem de curriculos
- CRUD completo de preferencias de curriculo

## Analise do schema atual

Tabelas relacionadas:

- `curriculum`
- `students`
- `users`

Campos disponiveis:

- `curriculum.id`: ID do curriculo
- `curriculum.student_id`: aluno dono do curriculo
- `curriculum.is_available`: disponibilidade do curriculo
- `students.full_name`: nome do aluno
- `students.social_name`: nome social, quando informado
- `students.cpf`: CPF do aluno
- `students.activity_area`: area de interesse/atuacao
- `users.email`: usado apenas para busca, nao deve ser logado

Campos ausentes:

- nao existe coluna persistida para `preference`
- nao existe coluna textual `status`; existe `is_available`

## Decisoes tecnicas

### IDs do modo selected

`ids` representa IDs de curriculos (`curriculum.id`), porque a US trata a selecao de linhas de curriculo.

### Area de Interesse

Origem:

```text
students.activity_area
```

Regra:

- exibir o valor informado
- se vazio/nulo, exibir `-`
- filtro `interestArea` aplica `ILIKE` sobre `students.activity_area`

### Preferencia

Nao existe campo atual para preferencia no banco.

Decisao:

- criar migration adicionando `curriculum.preference varchar(100) null`
- mapear no ORM como `preference`
- filtro `preference` aplica `ILIKE` sobre `curriculum.preference`
- exibir `-` quando ausente

Motivo: a coluna `Preferencia` e o filtro `preference` sao parte explicita da US. Inferir preferencia a partir de infraestrutura do aluno, habilidades ou texto livre de `about` misturaria conceitos diferentes.

### Status

Origem:

```text
curriculum.is_available
```

Regra:

- `true` -> `ATIVO`
- `false` -> `INATIVO`
- filtro `status=ATIVO` aplica `is_available = true`
- filtro `status=INATIVO` aplica `is_available = false`

### Busca

Filtro `search` deve consultar campos relevantes para a listagem:

- nome do aluno
- nome social
- email do usuario
- CPF normalizado
- texto `about` do curriculo

Logging nunca deve registrar o valor bruto do filtro, porque ele pode conter CPF ou email.

## Endpoint

```http
POST /api/admin/reports/resumes
```

Nos testes E2E, sem prefixo global:

```http
POST /admin/reports/resumes
```

## Body

```ts
{
  mode: 'selected' | 'all';
  ids?: string[];
  filters?: {
    search?: string;
    interestArea?: string;
    preference?: string;
    status?: 'ATIVO' | 'INATIVO';
  };
}
```

## Response

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="relatorio_curriculos_AAAA-MM-DD_HHmmss.pdf"
```

## Erros esperados

- `400`: `mode="selected"` sem IDs
- `400`: `status` invalido
- `400`: resultado acima de 1000 curriculos
- `401`: JWT ausente/invalido
- `403`: usuario sem perfil admin

## Arquivos a criar

```text
src/adapters/in/dtos/reports/export-resumes-report.dto.ts
src/adapters/out/migrations/<timestamp>-AddPreferenceToCurriculum.ts
src/adapters/out/pdf/resume-report-pdf.generator.ts
src/adapters/out/repository/resume-report.repository.ts
src/core/ports/resume-report-pdf-generator.interface.ts
src/core/ports/resume-report.repository.interface.ts
src/core/services/resume-report.service.ts
test/unit/resume-report.service.spec.ts
test/unit/resume-report.repository.spec.ts
test/unit/resume-report-pdf.generator.spec.ts
test/integration/resume-reports.e2e-spec.ts
```

## Arquivos a alterar

```text
src/adapters/in/controllers/admin-reports.controller.ts
src/adapters/out/orm/curriculum.orm-entity.ts
src/adapters/out/seeds/seed.ts
src/app.module.ts
```

## Plano de acao

1. Criar migration `AddPreferenceToCurriculum`.
2. Mapear `preference` em `CurriculumOrmEntity`.
3. Criar DTO do endpoint.
4. Criar port e repository de relatorio de curriculos.
5. Criar port e generator PDF.
6. Criar service com validacao, limite, mascaramento de CPF e logging seguro.
7. Adicionar rota `POST /admin/reports/resumes`.
8. Registrar providers no `AppModule`.
9. Atualizar seed com preferencias de exemplo.
10. Criar testes unitarios.
11. Criar teste E2E.
12. Rodar lint, build, unitarios e E2E.

## Criterio de pronto

- endpoint admin funcional
- modo `selected` por `curriculum.id`
- modo `all` com filtros combinados
- CPF completo nao aparece no PDF nem nos logs de service
- PDF valido com 4 colunas
- `status` formatado como `ATIVO`/`INATIVO`
- limite de 1000 registros com `400`
- testes passando
