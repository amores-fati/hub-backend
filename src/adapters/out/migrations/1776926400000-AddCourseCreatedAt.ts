import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseCreatedAt1776926400000 implements MigrationInterface {
  name = 'AddCourseCreatedAt1776926400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "created_at"`);
  }
}
