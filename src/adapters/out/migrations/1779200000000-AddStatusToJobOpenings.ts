import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToJobOpenings1779200000000 implements MigrationInterface {
  name = 'AddStatusToJobOpenings1779200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "job_openings"
      ADD COLUMN "is_active" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "job_openings"
      DROP COLUMN "is_active"
    `);
  }
}
