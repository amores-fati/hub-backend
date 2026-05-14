import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAdminCoursesTable1778700000000 implements MigrationInterface {
  name = 'DropAdminCoursesTable1778700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_courses"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "admin_courses" (
        "id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text NOT NULL,
        "modality" character varying NOT NULL,
        "shift" character varying NOT NULL,
        "image_url" character varying,
        "address" character varying,
        "vacancy_count" integer,
        "workload_hours" integer,
        "start_date" date,
        "end_date" date,
        "enrollment_start" date,
        "enrollment_end" date,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_admin_courses" PRIMARY KEY ("id")
      )
    `);
  }
}
