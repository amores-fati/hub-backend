# PR - company-list-xlsx

## Contexto

Esta branch implementa a exportacao real de empresas em XLSX para a area administrativa.

A entrega substitui a ideia de export local/mockado por um endpoint backend autenticado, reutilizando o mesmo escopo da tela de empresas e os filtros que ja fazem sentido no produto atual: busca textual, status, UF e cidade.

O contrato de empresas nesta branch e apenas XLSX. PDF e CSV para empresas nao fazem parte desta entrega.

## Funcionalidade entregue

- Adiciona `POST /api/admin/reports/companies` para download de empresas em XLSX.
- Suporta exportacao de todas as empresas filtradas com `mode: "all"`.
- Suporta exportacao de empresas selecionadas com `mode: "selected"` e lista de `ids`.
- Reutiliza dados reais de empresa, usuario, telefone e endereco.
- Adiciona filtros de listagem/exportacao por `search`, `status`, `state` e `city`.
- Mantem status alinhado com o dominio atual: `ATIVO` e `INATIVO`.
- Aplica limite de 1000 linhas por exportacao.
- Gera arquivo com aba `Empresas`.
- Estiliza somente o cabecalho real do XLSX, sem vazar cor para colunas vazias.
- Documenta o contrato para o frontend em `docs/frontend-contracts/company-export-xlsx.md`.

## Endpoints

### Listagem paginada de empresas

```http
GET /api/companies/filter
```

Query params suportados:

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

### Localidades para filtros da tela

```http
GET /api/admins/locations?scope=COMPANY
```

Resposta:

```ts
type CompanyLocation = {
  city: string;
  uf: string;
};
```

### Exportacao XLSX de empresas

```http
POST /api/admin/reports/companies
```

Headers:

```http
Authorization: Bearer <token-admin>
Content-Type: application/json
Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

Resposta:

```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="relatorio_empresas_AAAA-MM-DD_HHmmss.xlsx"
```

## Payloads

### Exportar resultado filtrado

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

### Exportar empresas selecionadas

```json
{
  "mode": "selected",
  "ids": [
    "123e4567-e89b-12d3-a456-426614174000"
  ]
}
```

## Colunas do XLSX

- Empresa
- CNPJ
- Email
- Telefone
- Estado
- Cidade
- Bairro
- Status
- Data de Cadastro

## Arquivos

### Controller e DTOs

### `src/adapters/in/controllers/admin-reports.controller.ts`
- descricao: adiciona endpoint `POST /admin/reports/companies`.
- objetivo: expor download XLSX de empresas para usuarios admin e retornar resposta binaria com headers corretos.
- testes relacionados: `test/integration/company-reports.e2e-spec.ts`

### `src/adapters/in/dtos/reports/export-companies-report.dto.ts`
- descricao: define o payload do export de empresas.
- objetivo: validar `mode`, `ids` e filtros opcionais de empresas.
- testes relacionados: `test/unit/company-report.service.spec.ts`, `test/integration/company-reports.e2e-spec.ts`

### `src/adapters/in/controllers/company.controller.ts`
- descricao: passa `state` e `city` para o service de listagem filtrada.
- objetivo: alinhar a listagem administrativa com os filtros usados no export.
- testes relacionados: `test/unit/company.service.spec.ts`

### `src/adapters/in/dtos/company/filter-companies.dto.ts`
- descricao: adiciona filtros `state` e `city` na listagem paginada de empresas.
- objetivo: permitir que a tela filtre empresas por UF e cidade quando usar dados reais do backend.
- testes relacionados: `test/unit/company.service.spec.ts`

### Core e ports

### `src/core/services/company-report.service.ts`
- descricao: adiciona o caso de uso de relatorio XLSX de empresas.
- objetivo: validar modo de exportacao, aplicar limite de linhas, normalizar filtros, formatar CNPJ/telefone/data/status e acionar o gerador XLSX.
- testes relacionados: `test/unit/company-report.service.spec.ts`

### `src/core/ports/company-report-xlsx-generator.interface.ts`
- descricao: adiciona contrato do gerador XLSX de empresas.
- objetivo: desacoplar o service da implementacao concreta com ExcelJS.
- testes relacionados: `test/unit/company-report.service.spec.ts`

### `src/core/ports/company.repository.interface.ts`
- descricao: amplia o contrato do repositorio de empresas.
- objetivo: incluir filtros `state`/`city` e metodos especificos para buscar projecoes de relatorio por IDs ou por filtros.
- testes relacionados: `test/unit/company.service.spec.ts`, `test/integration/company-reports.e2e-spec.ts`

### Repositorio e gerador XLSX

### `src/adapters/out/repository/company.repository.ts`
- descricao: adiciona consultas reais para o relatorio de empresas e reaproveita joins de listagem.
- objetivo: buscar dados de empresa, usuario, telefone e endereco; aplicar filtros por busca, status, UF e cidade; preservar ordem dos IDs selecionados.
- testes relacionados: `test/integration/company-reports.e2e-spec.ts`

### `src/adapters/out/xlsx/company-report-xlsx.generator.ts`
- descricao: gera o arquivo XLSX com ExcelJS.
- objetivo: criar workbook, aba `Empresas`, colunas do relatorio, estilos de cabecalho e ajuste automatico de largura.
- testes relacionados: `test/unit/company-report-xlsx.generator.spec.ts`

### Injecao de dependencias e pacotes

### `src/app.module.ts`
- descricao: registra `CompanyReportService` e `ICompanyReportXlsxGenerator`.
- objetivo: disponibilizar o novo caso de uso e gerador no modulo principal.
- testes relacionados: `npm run build`, `test/integration/company-reports.e2e-spec.ts`

### `package.json`
- descricao: adiciona dependencia `exceljs`.
- objetivo: permitir gerar XLSX no backend.
- testes relacionados: `npm run build`, `npm test -- --runInBand`

### `package-lock.json`
- descricao: atualiza lockfile das dependencias.
- objetivo: garantir instalacao reproduzivel do ExcelJS.
- testes relacionados: `npm run build`, `npm test -- --runInBand`

### Documentacao

### `docs/frontend-contracts/company-export-xlsx.md`
- descricao: documenta o contrato para o frontend.
- objetivo: registrar endpoints, payloads, headers, resposta binaria, colunas, erros esperados e checklist de integracao.
- testes relacionados: documentacao tecnica, sem teste automatizado direto.

### Testes

### `test/unit/company-report.service.spec.ts`
- descricao: cobre regras do caso de uso de exportacao de empresas.
- objetivo: validar modos `all`/`selected`, filtros, limite de linhas, formatacoes e logs sem valores sensiveis brutos.

### `test/unit/company-report-xlsx.generator.spec.ts`
- descricao: cobre a geracao do arquivo XLSX.
- objetivo: validar workbook, aba, headers, linha de dados e estilo limitado ate a ultima coluna real do relatorio.

### `test/integration/company-reports.e2e-spec.ts`
- descricao: cobre o endpoint `POST /admin/reports/companies`.
- objetivo: validar export selected, export all com filtros, rejeicao de selected vazio e bloqueio de usuario nao admin.

### `test/unit/company.service.spec.ts`
- descricao: atualiza mock do repositorio de empresas.
- objetivo: manter os testes existentes compativeis com os novos metodos do contrato.

## Testes executados

### Build

Comando:

```bash
npm run build
```

Resultado:

```text
build executado com sucesso
```

### Testes unitarios completos

Comando:

```bash
npm test -- --runInBand
```

Resultado:

```text
Test Suites: 28 passed, 28 total
Tests:       172 passed, 172 total
Snapshots:   0 total
```

### E2E especifico de empresas

Comando:

```bash
npm run test:e2e -- company-reports.e2e-spec.ts
```

Resultado:

```text
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

### Teste unitario do gerador XLSX apos ajuste visual do cabecalho

Comando:

```bash
npm test -- --runInBand company-report-xlsx.generator.spec.ts
```

Resultado:

```text
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

## Fora de escopo nesta branch

- PDF de empresas.
- CSV de empresas via backend.
- Filtro de data para empresas.
- Integracao visual no frontend.

## Observacoes para o frontend

- O front deve baixar empresas via `POST /api/admin/reports/companies`.
- A resposta deve ser tratada como `Blob` ou `ArrayBuffer`.
- O filename deve ser lido do header `Content-Disposition` quando disponivel.
- Para exportar resultado atual, usar `mode: "all"` e enviar os filtros da tela.
- Para exportar selecao, usar `mode: "selected"` e enviar `ids`.
- Para `state`, preferir enviar UF (`RS`, `SC`, `SP`) obtida em `GET /api/admins/locations?scope=COMPANY`.
- Nao enviar filtro de data nesta entrega.
