import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHouseholdSizeToStudent1778170800000 implements MigrationInterface {
  name = 'AddHouseholdSizeToStudent1778170800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "students" ADD "household_size" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "household_size"`,
    );
  }
}
