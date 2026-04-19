import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorStudentAndDisabilitySchema1776840000000 implements MigrationInterface {
  name = 'RefactorStudentAndDisabilitySchema1776840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "disabilities" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "disabilities" DROP COLUMN "has_report"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "has_technology_course"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "send_curriculum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "social_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "course_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "family_income" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__how_heard"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__education"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__race"`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "how_heard" = 'REFEREE' WHERE "how_heard" = 'REFERRAL'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "how_heard" = 'OTHERS' WHERE "how_heard" IN ('GOOGLE', 'EVENT')`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "education" = 'SECONDARY' WHERE "education" = 'TECHNICAL'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "education" = 'NO_EDUCATION' WHERE "education" = 'OTHER'`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "race" = 'INDIGENOUS' WHERE "race" = 'ASIAN'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "race" = 'PREFER_NOT_TO_SAY' WHERE "race" = 'OTHER'`,
    );

    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "ck_students__how_heard" CHECK ("how_heard" IS NULL OR "how_heard" IN ('INSTAGRAM', 'REFEREE', 'LINKEDIN', 'OTHERS'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "ck_students__education" CHECK ("education" IS NULL OR "education" IN ('NO_EDUCATION', 'PRIMARY', 'SECONDARY', 'HIGHER', 'POSTGRADUATE'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "ck_students__race" CHECK ("race" IS NULL OR "race" IN ('WHITE', 'BLACK', 'BROWN', 'INDIGENOUS', 'PREFER_NOT_TO_SAY'))`,
    );

    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "ck_students__family_income" CHECK ("family_income" IS NULL OR "family_income" IN ('TO1_SALARY', 'BETWEEN_1_3', 'MORE_THAN_3'))`,
    );

    await queryRunner.query(
      `DROP TABLE IF EXISTS "accessibility_resources" CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "accessibility_resources" ("id" SERIAL NOT NULL, "resource" character varying NOT NULL, "student_id" uuid NOT NULL, CONSTRAINT "PK_accessibility_resources" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessibility_resources" ADD CONSTRAINT "FK_accessibility_resources_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "ck_students__race"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "ck_students__education"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "ck_students__how_heard"`,
    );

    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "ck_students__family_income"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "family_income"`,
    );
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "course_name"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "social_name"`);
    await queryRunner.query(
      `ALTER TABLE "students" ADD "send_curriculum" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "has_technology_course" boolean`,
    );
    await queryRunner.query(
      `ALTER TABLE "disabilities" ADD "has_report" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "disabilities" ADD "description" text`,
    );
  }
}
