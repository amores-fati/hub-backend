import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToUsers1777000000000 implements MigrationInterface {
  name = 'AddSoftDeleteToUsers1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "deleted_at" TIMESTAMPTZ DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "deleted_at"
    `);
  }
}
