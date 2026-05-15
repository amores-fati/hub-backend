import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetadataColumns1778600000000 implements MigrationInterface {
  name = 'AddMetadataColumns1778600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {

    const tablesWithBoth = [
      'users',
      'admins',
      'students',
      'companies',
      'curriculum',
      'skills',
      'curriculum_skills',
      'job_openings',
      'job_skills',
      'in_person_course_details',
      'settings',
    ];

    for (const table of tablesWithBoth) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `);
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `);
    }

    // --- tables that already have created_at, only need updated_at ---

    const tablesOnlyUpdated = ['courses', 'enrollments'];

    for (const table of tablesOnlyUpdated) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tablesWithBoth = [
      'users',
      'admins',
      'students',
      'companies',
      'curriculum',
      'skills',
      'curriculum_skills',
      'job_openings',
      'job_skills',
      'in_person_course_details',
      'settings',
    ];

    for (const table of tablesWithBoth) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN "updated_at"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN "created_at"`,
      );
    }

    const tablesOnlyUpdated = ['courses', 'enrollments'];

    for (const table of tablesOnlyUpdated) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN "updated_at"`,
      );
    }
  }
}