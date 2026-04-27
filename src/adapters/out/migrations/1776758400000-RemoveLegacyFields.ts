import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLegacyFields1776758400000 implements MigrationInterface {
  name = 'RemoveLegacyFields1776758400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "social_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "course_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "technology_courses_list"`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefits" DROP COLUMN IF EXISTS "benefit_other"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessibility_resources" DROP COLUMN IF EXISTS "resource_other"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN "social_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN "course_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN "technology_courses_list" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefits" ADD COLUMN "benefit_other" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessibility_resources" ADD COLUMN "resource_other" character varying(100)`,
    );
  }
}
