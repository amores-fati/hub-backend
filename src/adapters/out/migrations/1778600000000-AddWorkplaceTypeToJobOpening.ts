import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkplaceTypeToJobOpening1778600000000
  implements MigrationInterface
{
  name = 'AddWorkplaceTypeToJobOpening1778600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "job_openings"
      ADD COLUMN "workplace_type" character varying(20) NOT NULL DEFAULT 'presential'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "job_openings"
      DROP COLUMN "workplace_type"
    `);
  }
}
