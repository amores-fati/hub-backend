import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModalityToCourse1777600000001 implements MigrationInterface {
  name = 'AddModalityToCourse1777600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" ADD "modality" character varying NOT NULL DEFAULT 'ONLINE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "modality"`);
  }
}
