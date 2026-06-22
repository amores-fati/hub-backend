import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveWorkplaceTypeToJobOpenings1778706618823 implements MigrationInterface {
  name = 'MoveWorkplaceTypeToJobOpenings1778706618823';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update existing workplace_type column in job_openings table
    await queryRunner.query(`
            ALTER TABLE "job_openings"
            ALTER COLUMN "workplace_type" TYPE VARCHAR(100),
            ALTER COLUMN "workplace_type" SET DEFAULT 'presencial'
        `);

    await queryRunner.query(`
            UPDATE "job_openings"
            SET "workplace_type" = 'presencial'
            WHERE "workplace_type" = 'presential'
        `);

    // Add check constraint for job_openings
    await queryRunner.query(`
            ALTER TABLE "job_openings"
            ADD CONSTRAINT "ck_job_openings__workplace_type"
            CHECK ("workplace_type" IN ('presencial', 'online', 'hibrido'))
        `);

    // Remove check constraint from companies
    await queryRunner.query(`
            ALTER TABLE "companies"
            DROP CONSTRAINT "ck_companies__workplace_type"
        `);

    // Remove workplace_type column from companies
    await queryRunner.query(`
            ALTER TABLE "companies"
            DROP COLUMN "workplace_type"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add workplace_type column back to companies
    await queryRunner.query(`
            ALTER TABLE "companies"
            ADD COLUMN "workplace_type" VARCHAR(100) NOT NULL DEFAULT 'presencial'
        `);

    // Add check constraint back to companies
    await queryRunner.query(`
            ALTER TABLE "companies"
            ADD CONSTRAINT "ck_companies__workplace_type"
            CHECK ("workplace_type" IN ('presencial', 'online', 'hibrido'))
        `);

    // Remove check constraint from job_openings
    await queryRunner.query(`
            ALTER TABLE "job_openings"
            DROP CONSTRAINT "ck_job_openings__workplace_type"
        `);

    // Revert workplace_type column in job_openings table
    await queryRunner.query(`
            ALTER TABLE "job_openings"
            ALTER COLUMN "workplace_type" TYPE VARCHAR(20),
            ALTER COLUMN "workplace_type" SET DEFAULT 'presential'
        `);

    await queryRunner.query(`
            UPDATE "job_openings"
            SET "workplace_type" = 'presential'
            WHERE "workplace_type" = 'presencial'
        `);
  }
}
