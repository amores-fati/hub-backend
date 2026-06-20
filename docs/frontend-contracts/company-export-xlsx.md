# Contrato Frontend - Exportacao XLSX de Empresas

## Visao geral

O backend possui exportacao real de empresas em XLSX para a tela administrativa de empresas.

A tela deve usar a listagem paginada existente para exibir os dados e, no momento do download, chamar o endpoint de relatorio. O frontend nao deve gerar o arquivo de empresas localmente quando a intencao for exportar dados reais do backend.

Base publica esperada:

```http
/api
```

Headers obrigatorios para rotas autenticadas:

```http
Authorization: Bearer <token-admin>
```

## Endpoints usados pela tela

### 1. Listagem paginada de empresas

```http
GET /api/companies/filter
```

Permissao:

```text
ADMIN
```

Query params:

```ts
type FilterCompaniesQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ATIVO' | 'INATIVO';
  state?: string;
  city?: string;
};
```

Detalhes dos filtros:

- `search`: busca parcial por razao social, CNPJ ou e-mail.
- `status`: situacao da empresa. Valores aceitos: `ATIVO` ou `INATIVO`.
- `state`: UF da empresa, por exemplo `RS`, `SC`, `SP`.
- `city`: cidade da empresa.
- Campos vazios devem ser omitidos da query.

Exemplo:

```http
GET /api/companies/filter?page=1&limit=10&search=tech&status=ATIVO&state=RS&city=Porto%20Alegre
```

Resposta:

```ts
type PaginatedCompaniesResponse = {
  data: Array<{
    id: string;
    name: string;
    cnpj: string;
    email: string;
    responsibleName: string;
    status: 'ATIVO' | 'INATIVO';
  }>;
  total: number;
  page: number;
  limit: number;
};
```

### 2. Localidades para filtros

```http
GET /api/admins/locations?scope=COMPANY
```

Permissao:

```text
ADMIN
```

Resposta:

```ts
type CompanyLocation = {
  city: string;
  uf: string;
};
```

Exemplo:

```json
[
  {
    "city": "Porto Alegre",
    "uf": "RS"
  },
  {
    "city": "Florianopolis",
    "uf": "SC"
  }
]
```

Regra para o frontend:

- Usar `uf` como valor enviado no filtro `state`.
- Usar `city` como valor enviado no filtro `city`.
- Evitar enviar nome completo do estado se a tela ja possui a UF.

## Exportacao XLSX

```http
POST /api/admin/reports/companies
```

Permissao:

```text
ADMIN
```

Headers:

```http
Authorization: Bearer <token-admin>
Content-Type: application/json
Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

Resposta de sucesso:

```http
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="relatorio_empresas_AAAA-MM-DD_HHmmss.xlsx"
```

A resposta e binaria. O frontend deve consumir como `Blob` ou `ArrayBuffer`, nao como JSON.

## Payloads de exportacao

### Exportar resultado filtrado

Use quando o usuario quiser exportar todas as empresas que respeitam os filtros atuais da tela.

```ts
type ExportCompaniesAllPayload = {
  mode: 'all';
  filters?: {
    search?: string;
    status?: 'ATIVO' | 'INATIVO';
    state?: string;
    city?: string;
  };
};
```

Exemplo:

```json
{
  "mode": "all",
  "filters": {
    "search": "tech",
    "status": "ATIVO",
    "state": "RS",
    "city": "Porto Alegre"
  }
}
```

Regras:

- `filters` deve refletir os filtros aplicados na listagem.
- Campos sem valor devem ser omitidos.
- Nao enviar filtros de data nesta entrega.

### Exportar empresas selecionadas

Use quando o usuario marcar empresas especificas na tabela.

```ts
type ExportCompaniesSelectedPayload = {
  mode: 'selected';
  ids: string[];
};
```

Exemplo:

```json
{
  "mode": "selected",
  "ids": [
    "123e4567-e89b-12d3-a456-426614174000",
    "123e4567-e89b-12d3-a456-426614174001"
  ]
}
```

Regras:

- `ids` sao IDs de empresas.
- A lista `ids` deve conter pelo menos um item.
- Nesse modo, nao e necessario enviar filtros.
- O backend preserva a ordem dos IDs informados quando possivel.

## Colunas do XLSX

O arquivo gerado contem uma aba chamada:

```text
Empresas
```

Colunas:

- Empresa
- CNPJ
- Email
- Telefone
- Estado
- Cidade
- Bairro
- Status
- Data de Cadastro

## Limites e erros esperados

Limite:

```text
1000 empresas por exportacao
```

Erros esperados:

- `400`: payload invalido, lista `selected` vazia, filtros invalidos ou limite excedido.
- `401`: token ausente ou invalido.
- `403`: usuario autenticado sem perfil admin.
- `500`: erro inesperado.

Formato comum de erro:

```json
{
  "message": "Mensagem de erro",
  "error": "Bad Request",
  "statusCode": 400
}
```

Para `400`, o frontend deve exibir a `message` retornada pelo backend.

## Exemplo de download com fetch

```ts
function getFilenameFromContentDisposition(header: string | null) {
  if (!header) return null;
  const match = /filename="?([^"]+)"?/i.exec(header);
  return match?.[1] ?? null;
}

async function exportCompaniesXlsx(
  token: string,
  payload: ExportCompaniesAllPayload | ExportCompaniesSelectedPayload,
) {
  const response = await fetch('/api/admin/reports/companies', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? 'Erro ao exportar empresas.');
  }

  const blob = await response.blob();
  const filename =
    getFilenameFromContentDisposition(
      response.headers.get('content-disposition'),
    ) ?? 'relatorio_empresas.xlsx';

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
```

## Pontos fora desta entrega

- Filtro de data nao faz parte deste contrato.
- CSV backend para empresas nao faz parte deste contrato.
- PDF backend para empresas nao faz parte deste contrato.

## Checklist para o frontend

- [ ] Substituir export local/mockado de empresas pelo endpoint `POST /api/admin/reports/companies`.
- [ ] Consumir resposta do export como `Blob` ou `ArrayBuffer`.
- [ ] Usar filename do header `Content-Disposition` quando disponivel.
- [ ] Enviar `mode: 'all'` para exportar o resultado filtrado atual.
- [ ] Enviar `mode: 'selected'` com `ids` para exportar selecao da tabela.
- [ ] Reutilizar os filtros da tela: `search`, `status`, `state`, `city`.
- [ ] Omitir filtros vazios.
- [ ] Popular filtros de cidade/UF com `GET /api/admins/locations?scope=COMPANY`.
- [ ] Nao enviar filtro de data nesta primeira entrega.
