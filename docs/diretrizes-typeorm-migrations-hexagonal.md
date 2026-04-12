# Diretrizes consolidadas de TypeORM + Migrations para o hub-backend

## Objetivo

Este documento consolida:

- a direcao arquitetural desejada para TypeORM + PostgreSQL + Migrations
- o que ja faz sentido no projeto atual
- os ajustes necessarios para alinhar a branch `dev` a um fluxo mais robusto

A meta e esta:

- o codigo deve ser a fonte de verdade da modelagem
- o banco deve ser o reflexo versionado dessa modelagem
- nenhuma mudanca estrutural deve depender de ajuste manual no banco
- a arquitetura hexagonal deve continuar protegendo o dominio

---

## 1. Principios que devem ser mantidos

### 1.1 Separacao entre core e infraestrutura

Isto deve ser mantido:

- `src/core` = dominio, regras de negocio, casos de uso, ports e exceptions
- `src/adapters/in` = HTTP, DTOs, controllers
- `src/adapters/out` = persistencia, auth e infraestrutura
- `src/config` = configuracao
- `test` = testes

### 1.2 Ports no core e implementacoes concretas no adapter/out

Isto tambem deve ser mantido.

O core define contratos.
Os repositories concretos implementam esses contratos com TypeORM.

Beneficios:

- o dominio nao depende do ORM
- os services continuam testaveis com mocks
- a persistencia pode evoluir sem contaminar o core

### 1.3 DTOs separados de dominio e persistencia

DTO continua em `adapters/in/dtos`.

Nao deve haver mistura entre:

- DTO HTTP
- entidade de dominio
- entidade ORM

Cada camada tem responsabilidade propria.

### 1.4 Uso de `@nestjs/typeorm`

No contexto deste projeto, faz sentido manter `@nestjs/typeorm`.

Nao ha ganho pratico em reescrever a integracao manual com providers customizados neste momento.
O foco deve ser endurecer o fluxo de persistencia, nao reinventar a integracao com Nest.

---

## 2. Diagnostico do projeto atual

Hoje o projeto ja tem uma boa base arquitetural, mas ha inconsistencias no fluxo de banco:

- a aplicacao usa configuracao de banco dentro de `src/app.module.ts`
- a CLI de migrations usa `src/config/typeorm.config.ts`
- isso cria duplicacao e risco de drift
- o runtime ainda usa `synchronize` fora de producao
- o projeto ja faz mapeamento ORM <-> dominio dentro dos repositories, mas esse mapeamento ainda esta embutido neles
- o seed de desenvolvimento e executado junto do startup Docker

Conclusao pratica:

- a base atual e boa
- o principal problema nao e a arquitetura
- o principal problema e o fluxo de schema e configuracao de banco

---

## 3. Direcao alvo para o projeto

### 3.1 Uma unica fonte de configuracao do banco

Deve existir uma configuracao central compartilhada entre:

- Nest runtime
- CLI do TypeORM

Arquivos recomendados:

- `src/config/database.config.ts`
- `src/config/typeorm.datasource.ts`

Objetivo:

- eliminar duplicacao
- evitar divergencia entre app e CLI
- garantir que migrations apontem para o mesmo banco da aplicacao

### 3.2 `synchronize: false` em todos os ambientes

Esta e uma regra estrutural.

Se migrations sao a fonte de evolucao do schema, `synchronize: true` precisa sair de:

- local
- teste
- homologacao
- producao

Isso exige disciplina, mas evita schema invisivel e imprevisivel.

### 3.3 Schema so muda via migration

Toda mudanca estrutural deve virar migration.

Isso inclui:

- nova tabela
- nova coluna
- alteracao de tipo
- alteracao de nullability
- indice
- unique
- foreign key
- rename de tabela ou coluna
- enum
- remocao de coluna

Regra pratica:

- nada de ajustar schema manualmente no banco
- nada de contar com `synchronize`

### 3.4 Seed nao substitui migration

Seed deve servir para:

- dados de desenvolvimento
- dados de demonstracao
- dados de teste controlado

Seed nao deve servir para:

- criar schema
- corrigir schema
- compensar falta de migration

### 3.5 Entidades ORM tratadas como persistencia

As classes decoradas com `@Entity()` devem representar:

- tabela
- colunas
- relacionamentos
- indices
- constraints

Elas nao devem conter:

- regra de negocio
- decisao de autorizacao
- validacao de caso de uso

### 3.6 Mapeamento explicito ORM <-> dominio

O projeto ja faz isso nos repositories.
O proximo passo e tornar isso mais explicito e reutilizavel.

Pode ser feito de duas formas validas:

- manter `mapToOrm` e `mapToDomain` privados no repository, quando o agregado for simples
- extrair mappers dedicados, quando o agregado ficar grande ou repetitivo

Para este projeto, a segunda opcao tende a ser melhor para:

- `Company`
- `Student`
- possivelmente `Course`

---

## 4. Ajustes importantes para este projeto especifico

Estas decisoes evitam que a diretriz fique generica demais ou entre em conflito com o codigo atual.

### 4.1 Nao forcar `role` em `users` agora

Hoje o projeto modela perfis com estruturas separadas, como:

- `admins`
- `companies`
- `students`

Entao nao faz sentido impor agora um modelo obrigatorio com coluna `role` em `users`.

Se no futuro o time decidir unificar autorizacao por papel, isso deve vir como decisao de dominio e schema, nao como detalhe de documentacao.

### 4.2 Nao forcar `@PrimaryGeneratedColumn('uuid')`

Hoje o projeto gera UUID no codigo.
Isso esta alinhado com o desenho atual do dominio e dos services.

Portanto, a regra preferencial para agora deve ser:

- manter `@PrimaryColumn('uuid')` quando a identidade nasce no dominio/aplicacao

So trocar para geracao no banco se houver uma decisao explicita para isso.

### 4.3 `adapters/out/orm/entities` e recomendacao organizacional, nao prioridade critica

Organizar as entidades em:

- `src/adapters/out/orm/entities`

faz sentido.

Mas isso deve ser tratado como melhoria de organizacao, nao como bloqueio arquitetural.
O ganho real imediato esta em:

- config unica
- `synchronize: false`
- migrations confiaveis

### 4.4 Evitar dependencia cega de glob

No exemplo de configuracao, glob em `entities` e `migrations` e util, mas pode gerar atrito entre:

- `ts-node`
- build em `dist`
- CLI do TypeORM

Neste projeto, a recomendacao mais segura e:

- usar um builder central de `DataSourceOptions`
- decidir conscientemente entre lista explicita de entidades ou paths por ambiente

O importante nao e o glob em si.
O importante e runtime e CLI compartilharem a mesma configuracao.

### 4.5 Testes integrados tambem precisam seguir o fluxo de migrations

Se o projeto adotar `synchronize: false` de verdade, os testes E2E precisam refletir isso.

Fluxo esperado para E2E:

1. subir banco de teste
2. aplicar migrations
3. opcionalmente carregar seed especifico
4. executar testes

Sem isso, o projeto fica coerente em producao e incoerente em teste.

---

## 5. Estrutura recomendada

Estrutura alvo recomendada:

```text
src/
  config/
    database.config.ts
    typeorm.datasource.ts
    env.validation.ts

  adapters/
    out/
      orm/
        entities/
          user.orm-entity.ts
          company.orm-entity.ts
          student.orm-entity.ts
        mappers/
          user.orm-mapper.ts
          company.orm-mapper.ts
          student.orm-mapper.ts

      repository/
        user.repository.ts
        company.repository.ts
        student.repository.ts

      migrations/
      seeds/
```

Observacao:

- mover `orm/*.ts` para `orm/entities/` e recomendavel
- mas pode ser feito em uma etapa posterior, sem bloquear as correcoes mais importantes

---

## 6. Arquivos-base recomendados

### 6.1 `src/config/database.config.ts`

Este arquivo deve conter a funcao central que monta `DataSourceOptions`.

Diretrizes:

- usar as variaveis reais do projeto
- `synchronize: false`
- concentrar `entities` e `migrations`
- opcionalmente configurar `logging`
- opcionalmente configurar `ssl`

Exemplo adaptado ao projeto:

```ts
import { DataSourceOptions } from 'typeorm';

export function buildDatabaseOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: false,
    migrations: [__dirname + '/../adapters/out/migrations/*.{ts,js}'],
  };
}
```

### 6.2 `src/config/typeorm.datasource.ts`

Este arquivo deve expor o `DataSource` usado pela CLI:

```ts
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from './database.config';

export default new DataSource(buildDatabaseOptions());
```

### 6.3 `src/app.module.ts`

O `AppModule` deve reutilizar a mesma base de configuracao:

```ts
TypeOrmModule.forRootAsync({
  useFactory: async () => buildDatabaseOptions(),
})
```

Se o projeto optar por complementar configuracao em runtime, isso deve acontecer em cima da mesma base, sem duplicar fonte de verdade.

---

## 7. Repositories

Os repositories concretos devem:

- implementar as ports do core
- usar `Repository<OrmEntity>` do TypeORM
- fazer conversao ORM <-> dominio
- evitar regra de negocio

No projeto atual, esta direcao ja existe e deve ser preservada.
O que pode melhorar e a extracao gradual dos mapeamentos para mappers dedicados.

Exemplo de regra pratica:

- agregado simples: mapper pode continuar dentro do repository
- agregado complexo: extrair para `orm/mappers`

---

## 8. Fluxo correto de evolucao do banco

Fluxo recomendado:

1. alterar a entidade ORM
2. gerar ou criar a migration
3. revisar a migration manualmente
4. executar localmente
5. validar aplicacao e testes
6. commitar codigo + migration no mesmo PR
7. executar `migration:run` no ambiente alvo

Regra importante:

- `migration:generate` ajuda
- `migration:generate` nao substitui revisao humana

Casos para preferir migration manual:

- rename
- backfill de dados
- SQL especifico de PostgreSQL
- mudanca destrutiva
- mudanca sensivel em indice

---

## 9. Scripts recomendados

O `package.json` deve evoluir para algo nessa linha:

```json
{
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs -d src/config/typeorm.datasource.ts",
    "migration:create": "npm run typeorm -- migration:create",
    "migration:generate": "npm run typeorm -- migration:generate",
    "migration:run": "npm run typeorm -- migration:run",
    "migration:revert": "npm run typeorm -- migration:revert",
    "migration:show": "npm run typeorm -- migration:show"
  }
}
```

Observacao importante:

- no Windows e melhor evitar depender de interpolacao shell fragil
- o time pode padronizar o caminho da migration manualmente no comando
- o mais importante e a CLI apontar para `src/config/typeorm.datasource.ts`

---

## 10. Seeds

Recomendacoes praticas para este projeto:

- manter seed para desenvolvimento
- nao misturar seed com criacao de schema
- evitar que seed destrutivo rode automaticamente em qualquer ambiente sem intencao explicita

Recomendacao objetiva:

- separar um `seed:dev`
- separar um `seed:dev:reset` para o caso destrutivo
- deixar claro quando ele apaga e recria dados
- nao usar seed como parte obrigatoria do bootstrap da aplicacao fora de dev controlado

---

## 11. Testes

### 11.1 Testes unitarios

Continuam focados em:

- `core/services`
- controllers
- mocks das ports

### 11.2 Testes E2E

Devem refletir o fluxo real do banco.

Se o projeto depende de migrations, o E2E tambem deve depender de migrations.

Fluxo desejado:

- subir banco de teste
- aplicar migrations
- opcionalmente seed de teste
- executar testes

---

## 12. O que deve ser evitado

Evitar:

- `synchronize: true`
- DTO com decorator de TypeORM
- decorator de TypeORM dentro do `core`
- confiar cegamente em migration gerada
- usar seed para compensar falta de migration
- criar abstrações extras sem ganho pratico

---

## 13. Implementacao robusta para este projeto

No contexto do `hub-backend`, uma implementacao robusta significa:

- dominio sem TypeORM
- persistencia isolada em `adapters/out`
- configuracao unica de banco
- `DataSource` dedicado para CLI
- `synchronize: false`
- schema evoluindo so por migration
- mapeamento ORM <-> dominio explicito
- testes integrados alinhados ao fluxo de migrations
- seed tratado como dado inicial, nao como mecanismo de schema

---

## 14. Prioridades de implantacao

### Fase 1 - essencial

1. criar `src/config/database.config.ts`
2. criar `src/config/typeorm.datasource.ts`
3. fazer `AppModule` reutilizar a config central
4. desligar `synchronize` em runtime
5. ajustar scripts de migration para usar o novo `DataSource`
6. definir regra de schema somente via migration

### Fase 2 - endurecimento do fluxo

7. ajustar bootstrap de teste para rodar migrations
8. revisar startup Docker para nao depender de seed como parte estrutural
9. revisar E2E para refletir o fluxo real de banco
10. corrigir inconsistencias de modelagem ja existentes entre dominio, ORM e schema

### Fase 3 - organizacao e manutencao

11. mover `orm/*.ts` para `orm/entities/`, se o time quiser
12. extrair mappers dedicados para agregados maiores
13. revisar repositories para reduzir codigo repetido de mapeamento
14. criar baseline clara, se necessario

---

## 15. Conclusao

O projeto nao precisa de uma reconstrucao completa.

Ele ja tem uma base arquitetural boa:

- core separado
- ports definidos
- repositories concretos
- DTOs isolados

O que falta e endurecer o fluxo de persistencia.

O foco correto nao e adicionar camadas por adicionar.
O foco correto e:

- uma configuracao de banco confiavel
- migrations como fluxo oficial de schema
- runtime, CLI e testes apontando para a mesma verdade

Esse e o melhor equilibrio entre:

- a direcao da documentacao proposta
- a realidade do codigo atual
- o menor custo de mudanca com maior ganho estrutural
