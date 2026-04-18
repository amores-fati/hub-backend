# Modelo de persistencia atual e ajustes necessarios

## Status

Documento historico.

Este arquivo registrava uma fase anterior da migracao para TypeORM e nao deve mais ser usado como referencia do estado atual do projeto.

## Use estes arquivos no lugar

- `docs/esquema-banco-atual.md`
- `docs/modelo-alvo-banco.md`
- `docs/guia-mudancas-no-banco.md`
- `src/adapters/out/migrations/*.ts`
- `src/adapters/out/orm/*.ts`

## Motivo da substituicao

O repositorio atual ja consolidou:

- migrations versionadas
- metadata do TypeORM alinhado com o banco
- remocao dos campos legados
- separacao entre `api_db`, `api_db_test` e `api_db_e2e`

Manter o diagnostico antigo como documento operacional so gerava ruido.

## Uso recomendado daqui para frente

Se a necessidade for:

- entender o schema atual: use `docs/esquema-banco-atual.md`
- entender o modelo desejado: use `docs/modelo-alvo-banco.md`
- alterar banco com seguranca: use `docs/guia-mudancas-no-banco.md`

Este arquivo fica apenas por rastreabilidade historica.
