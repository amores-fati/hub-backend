# Guia Rápido: Como Subir uma Migration/Alteração no Banco

Este guia mostra apenas o passo a passo essencial para criar e aplicar uma migration no banco de dados via código.

---

## 1. Gere a migration

Crie uma nova migration com o comando:

```
npm run typeorm migration:generate -- -n NomeDescritivoDaMigration
```

- Substitua `NomeDescritivoDaMigration` por um nome que explique a alteração.


## Exemplos reais de operações

### Criar uma nova tabela

Altere ou crie a entidade (exemplo: `User`) e gere a migration normalmente. O arquivo gerado terá algo como:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
	await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL, "email" varchar(100) NOT NULL, PRIMARY KEY ("id"))`);
}

public async down(queryRunner: QueryRunner): Promise<void> {
	await queryRunner.query(`DROP TABLE "users"`);
}
```

### Adicionar uma coluna

```typescript
await queryRunner.query(`ALTER TABLE "users" ADD "role" varchar(20) NOT NULL DEFAULT 'STUDENT'`);
```

### Alterar tipo de coluna

```typescript
await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" TYPE varchar(150)`);
```

### Remover coluna

```typescript
await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
```

### Adicionar uma constraint CHECK

```typescript
await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "ck_users__role" CHECK (role IN ('ADMIN', 'STUDENT', 'COMPANY'))`);
```

### Exemplo de uso completo (CRUD)

```typescript
// Inserir
await queryRunner.query(`INSERT INTO "users" ("id", "email", "role") VALUES ('uuid', 'email@exemplo.com', 'STUDENT')`);

// Atualizar
await queryRunner.query(`UPDATE "users" SET "role" = 'ADMIN' WHERE "id" = 'uuid'`);

// Deletar
await queryRunner.query(`DELETE FROM "users" WHERE "id" = 'uuid'`);
```

> Sempre revise o código gerado pela migration antes de rodar em produção.

## 2. Revise o código gerado

- Abra o arquivo criado em `src/adapters/out/migrations/`.
- Confirme se as alterações estão corretas.

## 3. Execute a migration

Rode as migrations para aplicar as mudanças no banco:

```
npm run typeorm migration:run
```

## 4. Valide a alteração

- Verifique se o banco foi atualizado como esperado.
- Teste a aplicação, se necessário.

## 5. Versione o código

- Faça commit dos arquivos alterados (migration, entidades, etc).

---

Para detalhes e boas práticas, consulte os outros guias na pasta `docs/`.
