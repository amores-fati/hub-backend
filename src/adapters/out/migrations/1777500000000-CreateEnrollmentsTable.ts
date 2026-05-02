import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnrollmentsTable1777500000000 implements MigrationInterface {
  name = 'CreateEnrollmentsTable1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "enrollments" (
        "id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "type" varchar(20) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_enrollments" PRIMARY KEY ("id"),
        CONSTRAINT "ck_enrollments__type" CHECK ("type" IN ('ENROLLMENT', 'INTEREST')),
        CONSTRAINT "uq_enrollments__student_id__course_id__type" UNIQUE ("student_id", "course_id", "type"),
        CONSTRAINT "fk_enrollments__student_id__students" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "fk_enrollments__course_id__courses" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "ix_enrollments__student_id" ON "enrollments" ("student_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "ix_enrollments__student_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "enrollments"`);
  }
}
