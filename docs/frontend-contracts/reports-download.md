# Contrato Frontend - Downloads de Relatorios Administrativos

## Visao geral

Todos os endpoints abaixo geram PDF e devem ser consumidos como `Blob`.

Base publica:

```http
/api/admin/reports
```

Headers obrigatorios:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Response de sucesso:

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="<nome>.pdf"
```

O frontend deve usar o filename do header `Content-Disposition` quando existir e aplicar fallback local quando ausente.

## Fluxo de download no front

```ts
const response = await fetch('/api/admin/reports/courses', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const error = await response.json().catch(() => null);
  throw new Error(error?.message ?? 'Erro ao exportar relatorio.');
}

const blob = await response.blob();
const filename = getFilenameFromContentDisposition(
  response.headers.get('content-disposition'),
) ?? 'relatorio.pdf';

const url = URL.createObjectURL(blob);
const anchor = document.createElement('a');
anchor.href = url;
anchor.download = filename;
anchor.click();
URL.revokeObjectURL(url);
```

Helper sugerido:

```ts
function getFilenameFromContentDisposition(header: string | null) {
  if (!header) return null;
  const match = /filename="?([^"]+)"?/i.exec(header);
  return match?.[1] ?? null;
}
```

## Erros comuns

Formato padrao:

```json
{
  "message": "Mensagem de erro",
  "error": "Bad Request",
  "statusCode": 400
}
```

Status esperados:

- `400`: payload invalido, lista selected vazia, filtro invalido ou limite excedido
- `401`: token ausente/invalido
- `403`: usuario autenticado sem perfil admin
- `500`: erro inesperado

Para `400`, o front deve exibir `message` retornada pelo backend.

## Cursos

```http
POST /api/admin/reports/courses
```

Payload:

```ts
type ExportCoursesReportPayload = {
  mode: 'selected' | 'all';
  ids?: string[];
  filters?: {
    search?: string;
    modality?: string;
    status?: 'ATIVO' | 'INATIVO';
    startDate?: string; // ISO date: YYYY-MM-DD
    endDate?: string;   // ISO date: YYYY-MM-DD
  };
};
```

Exemplo selected:

```json
{
  "mode": "selected",
  "ids": ["123e4567-e89b-12d3-a456-426614174000"]
}
```

Exemplo all:

```json
{
  "mode": "all",
  "filters": {
    "status": "ATIVO",
    "modality": "ONLINE"
  }
}
```

Filename:

```text
relatorio_cursos_AAAA-MM-DD_HHmmss.pdf
```

Limite:

```text
1000 cursos
```

## Alunos

```http
POST /api/admin/reports/students
```

Payload:

```ts
type ExportStudentsReportPayload = {
  mode: 'selected' | 'all';
  ids?: string[];
  filters?: {
    search?: string;
    course?: string;
    location?: string;
    pcdType?: string;
    status?: 'ENROLLMENT' | 'INTEREST' | 'NAO_INSCRITO';
  };
};
```

Exemplo selected:

```json
{
  "mode": "selected",
  "ids": ["123e4567-e89b-12d3-a456-426614174000"]
}
```

Exemplo all:

```json
{
  "mode": "all",
  "filters": {
    "pcdType": "FISICO",
    "status": "ENROLLMENT"
  }
}
```

Filename:

```text
relatorio_alunos_AAAA-MM-DD_HHmmss.pdf
```

Limite:

```text
1000 alunos
```

Observacoes:

- CPF completo nunca aparece no PDF.
- Campo `search` pode conter nome, email ou CPF; o backend nao registra esse valor bruto em log.

## Vagas

```http
POST /api/admin/reports/vacancies
```

Payload:

```ts
type ExportVacanciesReportPayload = {
  mode: 'selected' | 'all';
  ids?: string[];
  filters?: {
    search?: string;
    isPcd?: boolean;
    dateFrom?: string; // ISO date: YYYY-MM-DD
    dateTo?: string;   // ISO date: YYYY-MM-DD
  };
};
```

Exemplo selected:

```json
{
  "mode": "selected",
  "ids": ["123e4567-e89b-12d3-a456-426614174000"]
}
```

Exemplo all:

```json
{
  "mode": "all",
  "filters": {
    "isPcd": true,
    "dateFrom": "2026-04-01",
    "dateTo": "2026-04-30"
  }
}
```

Filename:

```text
relatorio_vagas_AAAA-MM-DD_HHmmss.pdf
```

Limite:

```text
1000 vagas
```

Observacoes:

- `isPcd: false` e filtro valido. Nao omitir o campo quando a intencao for filtrar vagas nao PCD.

## Curriculos

```http
POST /api/admin/reports/resumes
```

Payload:

```ts
type ExportResumesReportPayload = {
  mode: 'selected' | 'all';
  ids?: string[];
  filters?: {
    search?: string;
    interestArea?: string;
    preference?: string;
    status?: 'ATIVO' | 'INATIVO';
  };
};
```

Exemplo selected:

```json
{
  "mode": "selected",
  "ids": ["123e4567-e89b-12d3-a456-426614174000"]
}
```

Exemplo all:

```json
{
  "mode": "all",
  "filters": {
    "interestArea": "Backend",
    "preference": "Remoto",
    "status": "ATIVO"
  }
}
```

Filename:

```text
relatorio_curriculos_AAAA-MM-DD_HHmmss.pdf
```

Limite:

```text
1000 curriculos
```

Observacoes:

- `ids` no modo selected sao IDs de curriculos.
- CPF completo nunca aparece no PDF.
- Campo `search` pode conter nome, email ou CPF; o backend nao registra esse valor bruto em log.
