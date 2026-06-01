import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnnouncementDateToJobOpenings1778700000000 implements MigrationInterface {
  name = 'AddAnnouncementDateToJobOpenings1778700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_openings" ADD "announcement_date" date NOT NULL DEFAULT CURRENT_DATE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_openings" DROP COLUMN "announcement_date"`,
    );
  }
}
