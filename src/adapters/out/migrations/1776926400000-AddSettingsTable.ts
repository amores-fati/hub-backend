import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettingsTable1776926400000 implements MigrationInterface {
  name = 'AddSettingsTable1776926400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "settings" (
        "key" character varying(100) NOT NULL,
        "value" text NOT NULL,
        CONSTRAINT "pk_settings" PRIMARY KEY ("key")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "settings"`);
  }
}
