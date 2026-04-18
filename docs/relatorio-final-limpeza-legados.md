# Relatorio Final de Limpeza de Legados

## Status

Documento de fechamento da limpeza de legados.

Ele nao substitui a documentacao operacional do projeto. Para o estado atual do schema e do fluxo de banco, use:

- `docs/esquema-banco-atual.md`
- `docs/modelo-alvo-banco.md`
- `docs/guia-mudancas-no-banco.md`

## Escopo consolidado

A limpeza final removeu referencias legadas de:

- dominio
- comandos
- DTOs
- repositories
- entidades ORM
- testes
- schema do banco

## Campos legados retirados do fluxo ativo

- `students.social_name`
- `students.course_name`
- `students.technology_courses_list`
- `students.gender_other`
- `social_benefits.benefit_other`
- `accessibility_resources.resource_other`

## Evidencias de alinhamento

- migrations aplicadas no banco E2E
- `npm run typeorm -- schema:log` sem queries pendentes
- `npm test -- --runInBand` passando
- `npm run test:e2e` passando

## Resultado

O codigo ativo e o banco real passaram a operar sobre o mesmo modelo persistente, sem depender de colunas removidas e sem drift conhecido no metadata do TypeORM.

## Uso recomendado daqui para frente

Este arquivo fica apenas como registro do fechamento da limpeza. Para evoluir o schema, siga o fluxo documentado em `docs/guia-mudancas-no-banco.md`.
