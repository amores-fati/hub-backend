# PR - feat/reports-download

## Contexto

Esta branch implementa o download de relatorios administrativos em PDF para:

- Cursos
- Alunos
- Vagas
- Curriculos

A funcionalidade adiciona endpoints protegidos para administradores em `POST /api/admin/reports/*`, com retorno `application/pdf` e header `Content-Disposition` para download do arquivo. Cada relatorio suporta os modos:

- `selected`: exporta registros selecionados por ID.
- `all`: exporta todos os registros de acordo com os filtros enviados.

Tambem foram adicionadas regras de validacao, normalizacao de filtros, limite maximo de 1000 linhas por exportacao, mascaramento de CPF nos relatorios de alunos/curriculos, geracao de nomes de arquivo padronizados e cobertura por testes unitarios e e2e.

## Arquivos

### Controller e DTOs

### `src/adapters/in/controllers/admin-reports.controller.ts`
- descricao: adiciona o controller administrativo dos relatorios.
- Objetivo: expor os endpoints `courses`, `students`, `vacancies` e `resumes`, exigir perfil admin, chamar os services e devolver o PDF como attachment.
- arquivo correspondente de teste: `test/integration/course-reports.e2e-spec.ts`, `test/integration/student-reports.e2e-spec.ts`, `test/integration/vacancy-reports.e2e-spec.ts`, `test/integration/resume-reports.e2e-spec.ts`

### `src/adapters/in/dtos/reports/export-courses-report.dto.ts`
- descricao: define o payload de exportacao de cursos.
- Objetivo: validar `mode`, `ids` e filtros de cursos como busca, modalidade, status e datas.
- arquivo correspondente de teste: `test/integration/course-reports.e2e-spec.ts`, `test/unit/course-report.service.spec.ts`

### `src/adapters/in/dtos/reports/export-students-report.dto.ts`
- descricao: define o payload de exportacao de alunos.
- Objetivo: validar `mode`, `ids` e filtros de alunos como busca, curso, localidade, tipo PCD e status de vinculo.
- arquivo correspondente de teste: `test/integration/student-reports.e2e-spec.ts`, `test/unit/student-report.service.spec.ts`

### `src/adapters/in/dtos/reports/export-vacancies-report.dto.ts`
- descricao: define o payload de exportacao de vagas.
- Objetivo: validar `mode`, `ids` e filtros de vagas como busca, PCD e intervalo de datas.
- arquivo correspondente de teste: `test/integration/vacancy-reports.e2e-spec.ts`, `test/unit/vacancy-report.service.spec.ts`

### `src/adapters/in/dtos/reports/export-resumes-report.dto.ts`
- descricao: define o payload de exportacao de curriculos.
- Objetivo: validar `mode`, `ids` e filtros de curriculos como busca, area de interesse, preferencia e status.
- arquivo correspondente de teste: `test/integration/resume-reports.e2e-spec.ts`, `test/unit/resume-report.service.spec.ts`

### Services de relatorio

### `src/core/services/course-report.service.ts`
- descricao: implementa a regra de negocio do relatorio de cursos.
- Objetivo: buscar cursos por selecao ou filtros, limitar a 1000 linhas, montar linhas do PDF e gerar o arquivo `relatorio_cursos_*.pdf`.
- arquivo correspondente de teste: `test/unit/course-report.service.spec.ts`, `test/integration/course-reports.e2e-spec.ts`

### `src/core/services/student-report.service.ts`
- descricao: implementa a regra de negocio do relatorio de alunos.
- Objetivo: normalizar filtros, proteger buscas sensiveis nos logs, mascarar CPF, formatar telefone/localidade/PCD e gerar `relatorio_alunos_*.pdf`.
- arquivo correspondente de teste: `test/unit/student-report.service.spec.ts`, `test/integration/student-reports.e2e-spec.ts`

### `src/core/services/vacancy-report.service.ts`
- descricao: implementa a regra de negocio do relatorio de vagas.
- Objetivo: aplicar filtros de vagas, aceitar `isPcd` falso como filtro valido, limitar resultados e gerar `relatorio_vagas_*.pdf`.
- arquivo correspondente de teste: `test/unit/vacancy-report.service.spec.ts`, `test/integration/vacancy-reports.e2e-spec.ts`

### `src/core/services/resume-report.service.ts`
- descricao: implementa a regra de negocio do relatorio de curriculos.
- Objetivo: normalizar filtros, validar status, mascarar CPF e gerar `relatorio_curriculos_*.pdf`.
- arquivo correspondente de teste: `test/unit/resume-report.service.spec.ts`, `test/integration/resume-reports.e2e-spec.ts`

### Contratos/ports do core

### `src/core/ports/course-report-pdf-generator.interface.ts`
- descricao: contrato do gerador de PDF de cursos.
- Objetivo: desacoplar o service de cursos da implementacao concreta de PDF.
- arquivo correspondente de teste: `test/unit/course-report-pdf.generator.spec.ts`, `test/unit/course-report.service.spec.ts`

### `src/core/ports/student-report-pdf-generator.interface.ts`
- descricao: contrato do gerador de PDF de alunos.
- Objetivo: definir as linhas e o comando de geracao do PDF de alunos.
- arquivo correspondente de teste: `test/unit/student-report-pdf.generator.spec.ts`, `test/unit/student-report.service.spec.ts`

### `src/core/ports/vacancy-report-pdf-generator.interface.ts`
- descricao: contrato do gerador de PDF de vagas.
- Objetivo: definir as linhas e o comando de geracao do PDF de vagas.
- arquivo correspondente de teste: `test/unit/vacancy-report-pdf.generator.spec.ts`, `test/unit/vacancy-report.service.spec.ts`

### `src/core/ports/resume-report-pdf-generator.interface.ts`
- descricao: contrato do gerador de PDF de curriculos.
- Objetivo: definir as linhas e o comando de geracao do PDF de curriculos.
- arquivo correspondente de teste: `test/unit/resume-report-pdf.generator.spec.ts`, `test/unit/resume-report.service.spec.ts`

### `src/core/ports/course.repository.interface.ts`
- descricao: amplia o contrato de repositorio de cursos.
- Objetivo: permitir busca de cursos com localizacao e filtros para relatorio.
- arquivo correspondente de teste: `test/unit/course-report.service.spec.ts`, `test/integration/course-reports.e2e-spec.ts`

### `src/core/ports/student.repository.interface.ts`
- descricao: amplia o contrato de repositorio de alunos.
- Objetivo: permitir busca de alunos projetados para relatorio, por IDs ou filtros.
- arquivo correspondente de teste: `test/unit/student.repository.spec.ts`, `test/unit/student-report.service.spec.ts`

### `src/core/ports/vacancy-report.repository.interface.ts`
- descricao: contrato especifico do repositorio de relatorio de vagas.
- Objetivo: definir filtros e projecao necessarios para montar o PDF de vagas.
- arquivo correspondente de teste: `test/unit/vacancy-report.repository.spec.ts`, `test/unit/vacancy-report.service.spec.ts`

### `src/core/ports/resume-report.repository.interface.ts`
- descricao: contrato especifico do repositorio de relatorio de curriculos.
- Objetivo: definir filtros e projecao necessarios para montar o PDF de curriculos.
- arquivo correspondente de teste: `test/unit/resume-report.repository.spec.ts`, `test/unit/resume-report.service.spec.ts`

### Repositorios e geradores PDF

### `src/adapters/out/repository/course.repository.ts`
- descricao: adiciona consultas de cursos para relatorio.
- Objetivo: buscar cursos por IDs ou filtros, preservar ordem dos selecionados e incluir endereco de cursos presenciais.
- arquivo correspondente de teste: `test/integration/course-reports.e2e-spec.ts`

### `src/adapters/out/repository/student.repository.ts`
- descricao: adiciona consultas de alunos para relatorio.
- Objetivo: buscar alunos ativos, contatos, PCD e cursos vinculados por selecao ou filtros.
- arquivo correspondente de teste: `test/unit/student.repository.spec.ts`, `test/integration/student-reports.e2e-spec.ts`

### `src/adapters/out/repository/vacancy-report.repository.ts`
- descricao: adiciona repositorio de relatorio de vagas.
- Objetivo: montar a projecao de vagas com nome, quantidade, PCD e data de anuncio.
- arquivo correspondente de teste: `test/unit/vacancy-report.repository.spec.ts`, `test/integration/vacancy-reports.e2e-spec.ts`

### `src/adapters/out/repository/resume-report.repository.ts`
- descricao: adiciona repositorio de relatorio de curriculos.
- Objetivo: montar a projecao de curriculos com aluno, CPF, area, preferencia e disponibilidade.
- arquivo correspondente de teste: `test/unit/resume-report.repository.spec.ts`, `test/integration/resume-reports.e2e-spec.ts`

### `src/adapters/out/pdf/course-report-pdf.generator.ts`
- descricao: gera o PDF do relatorio de cursos com `pdfkit`.
- Objetivo: criar layout tabular contendo curso, modalidade, endereco, status e datas.
- arquivo correspondente de teste: `test/unit/course-report-pdf.generator.spec.ts`

### `src/adapters/out/pdf/student-report-pdf.generator.ts`
- descricao: gera o PDF do relatorio de alunos com `pdfkit`.
- Objetivo: criar layout tabular contendo aluno, CPF mascarado, curso, email, telefone, localidade e PCD.
- arquivo correspondente de teste: `test/unit/student-report-pdf.generator.spec.ts`

### `src/adapters/out/pdf/vacancy-report-pdf.generator.ts`
- descricao: gera o PDF do relatorio de vagas com `pdfkit`.
- Objetivo: criar layout tabular contendo vaga, quantidade, PCD e data de anuncio.
- arquivo correspondente de teste: `test/unit/vacancy-report-pdf.generator.spec.ts`

### `src/adapters/out/pdf/resume-report-pdf.generator.ts`
- descricao: gera o PDF do relatorio de curriculos com `pdfkit`.
- Objetivo: criar layout tabular contendo aluno, CPF mascarado, area de interesse, preferencia e status.
- arquivo correspondente de teste: `test/unit/resume-report-pdf.generator.spec.ts`

### Dominio, ORM, migrations e seed

### `src/core/domain/course-status.enum.ts`
- descricao: adiciona enum de status de curso.
- Objetivo: padronizar os status `ATIVO` e `INATIVO` usados no cadastro e no relatorio.
- arquivo correspondente de teste: `test/unit/course.service.spec.ts`, `test/integration/course-reports.e2e-spec.ts`

### `src/core/domain/course.entity.ts`
- descricao: adiciona status na entidade de curso.
- Objetivo: permitir salvar, retornar e filtrar cursos por status.
- arquivo correspondente de teste: `test/unit/course.service.spec.ts`

### `src/core/command/course.command.ts`
- descricao: adiciona status no comando de criacao de curso.
- Objetivo: transportar o novo campo ate o dominio.
- arquivo correspondente de teste: `test/unit/course.service.spec.ts`

### `src/adapters/in/dtos/course/create-course.dto.ts`
- descricao: adiciona validacao do status no DTO de curso.
- Objetivo: permitir que o backend receba `ATIVO` ou `INATIVO` ao criar cursos.
- arquivo correspondente de teste: `test/unit/course.service.spec.ts`

### `src/adapters/in/dtos/course/course-response.dto.ts`
- descricao: inclui status na resposta de curso.
- Objetivo: retornar o status cadastrado ao consumidor da API.
- arquivo correspondente de teste: `test/unit/course.service.spec.ts`

### `src/adapters/out/orm/course.orm-entity.ts`
- descricao: adiciona coluna de status na entidade ORM de cursos.
- Objetivo: persistir o status usado nos filtros do relatorio.
- arquivo correspondente de teste: `test/integration/course-reports.e2e-spec.ts`

### `src/adapters/out/orm/job-opening.orm-entity.ts`
- descricao: adiciona data de anuncio na entidade ORM de vagas.
- Objetivo: exibir e filtrar vagas por data no relatorio.
- arquivo correspondente de teste: `test/integration/vacancy-reports.e2e-spec.ts`

### `src/adapters/out/orm/curriculum.orm-entity.ts`
- descricao: adiciona preferencia no curriculo.
- Objetivo: permitir filtrar e exibir preferencia no relatorio de curriculos.
- arquivo correspondente de teste: `test/integration/resume-reports.e2e-spec.ts`

### `src/adapters/out/orm/enrollment.orm-entity.ts`
- descricao: ajusta os metadados de matricula/manifestacao de interesse.
- Objetivo: suportar ordenacao e filtros de vinculo usados nos relatorios de alunos.
- arquivo correspondente de teste: `test/unit/student.repository.spec.ts`, `test/integration/student-reports.e2e-spec.ts`

### `src/adapters/out/migrations/1778600000000-AddStatusToCourses.ts`
- descricao: migration para adicionar status em cursos.
- Objetivo: atualizar o banco para armazenar o status dos cursos.
- arquivo correspondente de teste: `test/integration/course-reports.e2e-spec.ts`

### `src/adapters/out/migrations/1778700000000-AddAnnouncementDateToJobOpenings.ts`
- descricao: migration para adicionar data de anuncio em vagas.
- Objetivo: atualizar o banco para filtros e exibicao do relatorio de vagas.
- arquivo correspondente de teste: `test/integration/vacancy-reports.e2e-spec.ts`

### `src/adapters/out/migrations/1778800000000-AddPreferenceToCurriculum.ts`
- descricao: migration para adicionar preferencia em curriculos.
- Objetivo: atualizar o banco para filtros e exibicao do relatorio de curriculos.
- arquivo correspondente de teste: `test/integration/resume-reports.e2e-spec.ts`

### `src/adapters/out/seeds/seed.ts`
- descricao: ajusta seed para popular campos adicionados.
- Objetivo: manter dados locais compativeis com os novos campos dos relatorios.
- arquivo correspondente de teste: `test/integration/*-reports.e2e-spec.ts`

### Injecao de dependencias e pacotes

### `src/app.module.ts`
- descricao: registra controller, services, repositorios e geradores PDF.
- Objetivo: disponibilizar a funcionalidade de relatorios no modulo principal da aplicacao.
- arquivo correspondente de teste: `test/integration/*-reports.e2e-spec.ts`

### `package.json`
- descricao: adiciona dependencias de geracao de PDF.
- Objetivo: incluir `pdfkit` e seus tipos para construir os arquivos PDF.
- arquivo correspondente de teste: `test/unit/*-report-pdf.generator.spec.ts`

### `package-lock.json`
- descricao: atualiza lockfile das dependencias.
- Objetivo: garantir instalacao reproduzivel das novas dependencias.
- arquivo correspondente de teste: `npm test`, `npm run test:e2e`, `npm run build`

### Documentacao

### `docs/us-14/us-14-1-relatorio-cursos-backend.md`
- descricao: documenta a implementacao do relatorio de cursos.
- Objetivo: registrar contrato HTTP, regras e criterios da US 14.1.
- arquivo correspondente de teste: `test/integration/course-reports.e2e-spec.ts`

### `docs/us-14/us-14-2-relatorio-alunos-backend.md`
- descricao: documenta a implementacao do relatorio de alunos.
- Objetivo: registrar contrato HTTP, filtros, privacidade de CPF e criterios da US 14.2.
- arquivo correspondente de teste: `test/integration/student-reports.e2e-spec.ts`

### `docs/us-14/us-14-3-relatorio-vagas-backend.md`
- descricao: documenta a implementacao do relatorio de vagas.
- Objetivo: registrar contrato HTTP, filtros e criterios da US 14.3.
- arquivo correspondente de teste: `test/integration/vacancy-reports.e2e-spec.ts`

### `docs/us-14/us-14-4-relatorio-curriculos-backend.md`
- descricao: documenta a implementacao do relatorio de curriculos.
- Objetivo: registrar contrato HTTP, filtros, privacidade de CPF e criterios da US 14.4.
- arquivo correspondente de teste: `test/integration/resume-reports.e2e-spec.ts`

### Testes adicionados ou atualizados

### `test/integration/course-reports.e2e-spec.ts`
- descricao: testa o fluxo e2e do relatorio de cursos.
- Objetivo: validar autenticacao admin, payloads, resposta PDF, filtros e erros.
- arquivo correspondente de teste: este proprio arquivo.

### `test/integration/student-reports.e2e-spec.ts`
- descricao: testa o fluxo e2e do relatorio de alunos.
- Objetivo: validar autenticacao admin, payloads, resposta PDF, filtros, CPF mascarado e erros.
- arquivo correspondente de teste: este proprio arquivo.

### `test/integration/vacancy-reports.e2e-spec.ts`
- descricao: testa o fluxo e2e do relatorio de vagas.
- Objetivo: validar autenticacao admin, payloads, resposta PDF, filtros e erros.
- arquivo correspondente de teste: este proprio arquivo.

### `test/integration/resume-reports.e2e-spec.ts`
- descricao: testa o fluxo e2e do relatorio de curriculos.
- Objetivo: validar autenticacao admin, payloads, resposta PDF, filtros, CPF mascarado e erros.
- arquivo correspondente de teste: este proprio arquivo.

### `test/unit/course-report.service.spec.ts`
- descricao: cobre as regras do service de relatorio de cursos.
- Objetivo: validar modos, lista vazia, limite de linhas, filename e chamada do gerador PDF.
- arquivo correspondente de teste: este proprio arquivo.

### `test/unit/student-report.service.spec.ts`
- descricao: cobre as regras do service de relatorio de alunos.
- Objetivo: validar filtros, status, mascaramento, limite de linhas e chamada do gerador PDF.
- arquivo correspondente de teste: este proprio arquivo.

### `test/unit/vacancy-report.service.spec.ts`
- descricao: cobre as regras do service de relatorio de vagas.
- Objetivo: validar filtros, modo selected/all, limite de linhas e chamada do gerador PDF.
- arquivo correspondente de teste: este proprio arquivo.

### `test/unit/resume-report.service.spec.ts`
- descricao: cobre as regras do service de relatorio de curriculos.
- Objetivo: validar filtros, status, mascaramento, limite de linhas e chamada do gerador PDF.
- arquivo correspondente de teste: este proprio arquivo.

### `test/unit/course-report-pdf.generator.spec.ts`
- descricao: cobre o gerador PDF de cursos.
- Objetivo: garantir que o gerador retorna um buffer de PDF valido.
- arquivo correspondente de teste: este proprio arquivo.

### `test/unit/student-report-pdf.generator.spec.ts`
- descricao: cobre o gerador PDF de alunos.
- Objetivo: garantir que o gerador retorna um buffer de PDF valido.
- arquivo correspondente de teste: este proprio arquivo.

### `test/unit/vacancy-report-pdf.generator.spec.ts`
- descricao: cobre o gerador PDF de vagas.
- Objetivo: garantir que o gerador retorna um buffer de PDF valido.
- arquivo correspondente de teste: este proprio arquivo.

### `test/unit/resume-report-pdf.generator.spec.ts`
- descricao: cobre o gerador PDF de curriculos.
- Objetivo: garantir que o gerador retorna um buffer de PDF valido.
- arquivo correspondente de teste: este proprio arquivo.

### `test/unit/vacancy-report.repository.spec.ts`
- descricao: cobre consultas do repositorio de relatorio de vagas.
- Objetivo: validar busca por IDs, filtros e projecao usada no PDF.
- arquivo correspondente de teste: este proprio arquivo.

### `test/unit/resume-report.repository.spec.ts`
- descricao: cobre consultas do repositorio de relatorio de curriculos.
- Objetivo: validar busca por IDs, filtros e projecao usada no PDF.
- arquivo correspondente de teste: este proprio arquivo.

### `test/unit/student.repository.spec.ts`
- descricao: atualiza testes do repositorio de alunos.
- Objetivo: validar a projecao e filtros do relatorio de alunos.
- arquivo correspondente de teste: este proprio arquivo.

### `test/unit/course.service.spec.ts`
- descricao: atualiza testes do service de cursos.
- Objetivo: cobrir o novo campo de status de curso.
- arquivo correspondente de teste: este proprio arquivo.

## Print dos tests

### Testes unitarios

Comando executado:

```bash
npm test -- --runInBand
```

Resultado:

```text
Test Suites: 25 passed, 25 total
Tests:       136 passed, 136 total
Snapshots:   0 total
Time:        70.288 s
Ran all test suites.
```

### Testes e2e com Docker

Comando executado:

```bash
npm run test:e2e
```

Resultado:

```text
Container hub-backend-postgres-e2e-1  Healthy

Test Suites: 7 passed, 7 total
Tests:       53 passed, 53 total
Snapshots:   0 total
Time:        39.13 s
Ran all test suites.
```

## Build passando

Comando executado:

```bash
npm run build
```

Resultado:

```text
> hub-backend@0.0.1 build
> nest build
```

Status: build executado com sucesso.
