import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFullNameToStudent1777600000000 implements MigrationInterface {
  name = 'AddFullNameToStudent1777600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "students" ADD "full_name" character varying NOT NULL DEFAULT 'N/A'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "full_name"`);
  }
}
