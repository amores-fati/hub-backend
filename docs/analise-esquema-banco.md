# Analise do Esquema Relacional

## Status

Documento historico.

Esta analise descrevia um banco anterior ao conjunto atual de migrations e nao representa mais o schema vigente do projeto.

## Referencias atuais

- `docs/esquema-banco-atual.md`
- `docs/modelo-alvo-banco.md`
- `src/adapters/out/migrations/*.ts`
- `src/adapters/out/orm/*.ts`

## O que mudou desde esta analise

O estado atual ja consolidou:

- `users.role` com `CHECK`
- `students`, `companies` e `admins` por PK compartilhada com `users`
- remocao dos campos legados de `students`, `social_benefits` e `accessibility_resources`
- `CHECK` constraints de dominio em `students`, `social_benefits` e `accessibility_resources`
- alinhamento entre migrations, metadata do TypeORM e banco real

## Uso recomendado daqui para frente

Se voce precisa trabalhar no banco hoje:

1. consulte `docs/esquema-banco-atual.md`
2. valide com `npm run typeorm -- schema:log`
3. use `docs/guia-mudancas-no-banco.md` para o fluxo de alteracao

Este arquivo permanece apenas como referencia historica.
