import { MigrationInterface, QueryRunner } from 'typeorm';

export class RelaxCurriculumResumeFields1777500000000 implements MigrationInterface {
  name = 'RelaxCurriculumResumeFields1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "curriculum"
      ALTER COLUMN "linkedin" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum"
      ALTER COLUMN "github" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum"
      ALTER COLUMN "video_presentation" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "curriculum" SET "linkedin" = '' WHERE "linkedin" IS NULL
    `);
    await queryRunner.query(`
      UPDATE "curriculum" SET "github" = '' WHERE "github" IS NULL
    `);
    await queryRunner.query(`
      UPDATE "curriculum"
      SET "video_presentation" = ''
      WHERE "video_presentation" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum"
      ALTER COLUMN "video_presentation" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum"
      ALTER COLUMN "github" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum"
      ALTER COLUMN "linkedin" SET NOT NULL
    `);
  }
}
