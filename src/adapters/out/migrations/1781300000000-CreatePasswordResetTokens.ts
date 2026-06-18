import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokens1781300000000 implements MigrationInterface {
  name = 'CreatePasswordResetTokens1781300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(255) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "used" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "used_at" timestamptz,
        CONSTRAINT "pk_password_reset_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "fk_password_reset_tokens__user_id__users"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "ix_password_reset_tokens__user_id"
      ON "password_reset_tokens" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "ix_password_reset_tokens__token_hash"
      ON "password_reset_tokens" ("token_hash")
    `);

    await queryRunner.query(`
      CREATE INDEX "ix_password_reset_tokens__expires_at"
      ON "password_reset_tokens" ("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "ix_password_reset_tokens__expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "ix_password_reset_tokens__token_hash"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "ix_password_reset_tokens__user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
  }
}
