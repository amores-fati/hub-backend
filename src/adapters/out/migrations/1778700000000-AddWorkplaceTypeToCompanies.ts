import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkplaceTypeToCompanies1778700000000 implements MigrationInterface {
  name = 'AddWorkplaceTypeToCompanies1778700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "workplace_type" VARCHAR(100) NOT NULL DEFAULT 'presencial'
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "ck_companies__workplace_type"
      CHECK ("workplace_type" IN ('presencial', 'online', 'hibrido'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP CONSTRAINT "ck_companies__workplace_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP COLUMN "workplace_type"
    `);
  }
}
