import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCepNotNullToAddresses1779300000000 implements MigrationInterface {
  name = 'AddCepNotNullToAddresses1779300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "address_student" SET "cep" = '' WHERE "cep" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "address_student" ALTER COLUMN "cep" SET NOT NULL
    `);

    await queryRunner.query(`
      UPDATE "address_company" SET "cep" = '' WHERE "cep" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "address_company" ALTER COLUMN "cep" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "address_company" ALTER COLUMN "cep" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "address_student" ALTER COLUMN "cep" DROP NOT NULL
    `);
  }
}
