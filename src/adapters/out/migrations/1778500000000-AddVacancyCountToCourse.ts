import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVacancyCountToCourse1778500000000 implements MigrationInterface {
  name = 'AddVacancyCountToCourse1778500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" ADD "vacancy_count" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" DROP COLUMN "vacancy_count"`,
    );
  }
}
