import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToCourses1778600000000 implements MigrationInterface {
  name = 'AddStatusToCourses1778600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" ADD "status" character varying(20) NOT NULL DEFAULT 'ATIVO'`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "ck_courses__status" CHECK ("status" IN ('ATIVO', 'INATIVO'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT "ck_courses__status"`,
    );
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "status"`);
  }
}
