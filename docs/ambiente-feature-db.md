# Ambiente isolado para a branch de migrations

## Objetivo

Este arquivo descreve como subir um ambiente Docker isolado para a branch
`feature/type-orm-migrations-bd`, sem reutilizar o banco principal atual.

Isto e recomendado porque hoje o bootstrap Docker da API roda:

1. `migration:run`
2. `seed`
3. `start:dev`

E o seed atual executa `TRUNCATE ... RESTART IDENTITY CASCADE`.

Usar o mesmo banco/container principal neste momento aumenta o risco de:

- sobrescrever dados do ambiente atual
- misturar schema antigo com schema em migracao
- mascarar problemas de integridade

## Decisao recomendada

Para esta fase, use outro container e outro volume.

Isso nao muda a estrategia futura do projeto.
Pelo contrario: permite validar as migrations e a modelagem em um ambiente
limpo antes de aplicar as mudancas na stack principal.

## Arquivo criado

- `docker-compose.feature.yml`

Ele sobe:

- `postgres-feature`
- `api-feature`

Configuracao desse ambiente:

- API: `http://localhost:3004`
- Swagger: `http://localhost:3004/api`
- Postgres feature: `localhost:5434`
- Banco usado pela API feature: `api_db_feature`
- Host interno da API para o banco: `postgres-feature`

## Como subir

Na raiz do projeto:

```bash
docker compose -f docker-compose.feature.yml -p hub-backend-feature up -d --build
```

## Como verificar

```bash
docker compose -f docker-compose.feature.yml -p hub-backend-feature ps
docker compose -f docker-compose.feature.yml -p hub-backend-feature logs -f api-feature
```

## Como parar

```bash
docker compose -f docker-compose.feature.yml -p hub-backend-feature down
```

## Como apagar tambem o volume desse ambiente

Use apenas se quiser resetar totalmente o banco isolado:

```bash
docker compose -f docker-compose.feature.yml -p hub-backend-feature down -v
```

## Quando usar a stack principal

So faz sentido voltar a aplicar essas mudancas no container principal quando:

- as migrations estiverem consistentes
- o drift principal de modelagem estiver resolvido
- o bootstrap estiver menos dependente de seed destrutivo
- o `synchronize` puder ser desligado com seguranca

## Observacao importante

Esse ambiente isolado reutiliza o codigo da branch atual via volume.
Entao ele serve para validar exatamente o estado corrente da branch sem tocar no
banco principal.
