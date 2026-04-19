# Guia Rapido de Subida

## Objetivo

Subir o projeto com o menor numero de passos no estado atual do repositorio.

## PowerShell

```powershell
npm.cmd install
docker compose up -d --build
docker compose ps
```

## Git Bash

```bash
npm install
docker compose up -d --build
docker compose ps
```

## O que sobe

- `postgres` em `localhost:5434`
- `postgres-test` em `localhost:5433`
- `api` em `http://localhost:3001`

No bootstrap Docker atual, o container da API executa:

1. `npm run migration:run`
2. `npm run seed:dev`
3. `npm run bootstrap:test:dev`
4. `npm run start:dev`

## Acessos

- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/docs`

## E2E

Para rodar a suite automatizada local:

```powershell
npm.cmd run test:e2e
```

Esse comando sobe `postgres-e2e` se necessario e executa a suite em `api_db_e2e`.

## Parar tudo

```powershell
docker compose down
```

## Referencia completa

Para detalhes de ambientes, bancos e scripts, use `docs/guia-execucao-e-ambientes.md`.
