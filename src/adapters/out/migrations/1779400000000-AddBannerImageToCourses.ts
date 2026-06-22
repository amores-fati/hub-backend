import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBannerImageToCourses1779400000000 implements MigrationInterface {
  name = 'AddBannerImageToCourses1779400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "courses" ALTER COLUMN "banner" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "courses" ADD COLUMN "banner_image" bytea
    `);

    await queryRunner.query(`
      ALTER TABLE "courses" ADD COLUMN "banner_image_mime_type" varchar(100)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "courses" DROP COLUMN "banner_image_mime_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "courses" DROP COLUMN "banner_image"
    `);

    await queryRunner.query(`
      UPDATE "courses" SET "banner" = '' WHERE "banner" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "courses" ALTER COLUMN "banner" SET NOT NULL
    `);
  }
}
