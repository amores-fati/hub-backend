import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveWorkplaceTypeToJobOpenings1778706618823 implements MigrationInterface {
    name = 'MoveWorkplaceTypeToJobOpenings1778706618823';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add workplace_type column to job_openings table
        await queryRunner.query(`
            ALTER TABLE "job_openings"
            ADD COLUMN "workplace_type" VARCHAR(100) NOT NULL DEFAULT 'presencial'
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

        // Remove workplace_type column from job_openings
        await queryRunner.query(`
            ALTER TABLE "job_openings"
            DROP COLUMN "workplace_type"
        `);
    }

}
