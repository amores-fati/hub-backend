import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreferenceToCurriculum1778800000000 implements MigrationInterface {
  name = 'AddPreferenceToCurriculum1778800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "curriculum" ADD "preference" character varying(100)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "curriculum" DROP COLUMN "preference"`,
    );
  }
}
