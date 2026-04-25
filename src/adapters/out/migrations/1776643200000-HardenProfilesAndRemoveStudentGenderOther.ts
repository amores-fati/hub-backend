import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenProfilesAndRemoveStudentGenderOther1776643200000 implements MigrationInterface {
  name = 'HardenProfilesAndRemoveStudentGenderOther1776643200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
      DROP COLUMN IF EXISTS "gender_other"
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ALTER COLUMN "contact_id" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ALTER COLUMN "date_of_birth" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ALTER COLUMN "gender" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ALTER COLUMN "race" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
      ALTER COLUMN "contact_id" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum"
      ALTER COLUMN "student_id" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "in_person_course_details"
      ALTER COLUMN "course_id" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "in_person_course_details"
      ALTER COLUMN "course_id" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum"
      ALTER COLUMN "student_id" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
      ALTER COLUMN "contact_id" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ALTER COLUMN "race" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ALTER COLUMN "gender" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ALTER COLUMN "date_of_birth" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ALTER COLUMN "contact_id" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ADD COLUMN "gender_other" character varying
    `);
  }
}
