# Guia Rapido

## Objetivo

Subir o projeto com o minimo de passos.

## PowerShell

```powershell
npm.cmd install
# ou
C:\AGES_III\back\hub-backend\docs\guia-rapido-subida.md
docker compose up -d --build
docker compose ps
```

## Git Bash

```bash
npm install
# ou
npm i
docker compose up -d --build
docker compose ps
```

## Acessos

- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/api`
- Postgres principal: `localhost:5434`

## Observacao

- No bootstrap Docker atual, a API roda `migration:run`, depois `seed:dev` e depois `start:dev`
- o seed so popula banco vazio

## Parar tudo

### PowerShell

```powershell
docker compose down
```

### Git Bash

```bash
docker compose down
```
