# Ambiente Feature DB

## Objetivo

Descrever o ambiente isolado definido em `docker-compose.feature.yml` para validar mudancas de banco sem tocar na stack principal.

## Quando usar

Use esse ambiente quando voce precisar:

- testar migrations novas sem reaproveitar o volume principal
- validar refatoracoes de schema em um banco limpo
- debugar uma branch com alteracoes estruturais mais invasivas

## Servicos

O compose de feature sobe:

- `postgres-feature`
- `api-feature`

## Portas e banco

- API feature: `http://localhost:3004`
- Swagger feature: `http://localhost:3004/docs`
- Postgres feature: `localhost:5435`
- banco: `api_db_feature`
- host interno da API: `postgres-feature`

## Subida

```powershell
docker compose -f docker-compose.feature.yml -p hub-backend-feature up -d --build
```

## Verificacao

```powershell
docker compose -f docker-compose.feature.yml -p hub-backend-feature ps
docker compose -f docker-compose.feature.yml -p hub-backend-feature logs -f api-feature
```

## Encerramento

```powershell
docker compose -f docker-compose.feature.yml -p hub-backend-feature down
```

## Reset completo

```powershell
docker compose -f docker-compose.feature.yml -p hub-backend-feature down -v
```

## Observacoes

- o ambiente feature existe para manter o banco principal fora do experimento
- a API feature segue o mesmo fluxo estrutural do projeto: migration, seed e subida do Nest
- para o estado oficial do schema, continue usando `docs/esquema-banco-atual.md`
