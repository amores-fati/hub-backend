import { MigrationInterface, QueryRunner } from 'typeorm';

import { SocialBenefitType } from '../../../core/domain/enums/social-benefit.enum';

function toSqlList(values: string[]): string {
  return values.map((value) => `'${value.replace(/'/g, "''")}'`).join(', ');
}

export class TrimLegacyContactColumnsAndProtectStudentLists1776556800000 implements MigrationInterface {
  name = 'TrimLegacyContactColumnsAndProtectStudentLists1776556800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contacts"
      DROP COLUMN IF EXISTS "name"
    `);
    await queryRunner.query(`
      ALTER TABLE "contacts"
      DROP COLUMN IF EXISTS "country"
    `);

    const benefitValues = toSqlList(Object.values(SocialBenefitType));
    await queryRunner.query(`
      UPDATE "social_benefits"
      SET "benefit" = '${SocialBenefitType.OTHERS}'
      WHERE "benefit" IS NOT NULL
        AND "benefit" NOT IN (${benefitValues})
    `);
    await queryRunner.query(`
      ALTER TABLE "social_benefits"
      DROP CONSTRAINT IF EXISTS "ck_social_benefits__benefit"
    `);
    await queryRunner.query(`
      ALTER TABLE "social_benefits"
      ADD CONSTRAINT "ck_social_benefits__benefit"
      CHECK ("benefit" IN (${benefitValues}))
    `);

    const resourceValues = toSqlList([
      'tea',
      'tdah',
      'visual',
      'auditiva',
      'motora',
      'down_syndrome',
      'intelectual',
      'other',
    ]);
    await queryRunner.query(`
      UPDATE "accessibility_resources"
      SET "resource" = 'other'
      WHERE "resource" IS NOT NULL
        AND "resource" NOT IN (${resourceValues})
    `);
    await queryRunner.query(`
      ALTER TABLE "accessibility_resources"
      DROP CONSTRAINT IF EXISTS "ck_accessibility_resources__resource"
    `);
    await queryRunner.query(`
      ALTER TABLE "accessibility_resources"
      ADD CONSTRAINT "ck_accessibility_resources__resource"
      CHECK ("resource" IN (${resourceValues}))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accessibility_resources"
      DROP CONSTRAINT IF EXISTS "ck_accessibility_resources__resource"
    `);
    await queryRunner.query(`
      ALTER TABLE "social_benefits"
      DROP CONSTRAINT IF EXISTS "ck_social_benefits__benefit"
    `);
    await queryRunner.query(`
      ALTER TABLE "contacts"
      ADD COLUMN "country" character varying(100)
    `);
    await queryRunner.query(`
      ALTER TABLE "contacts"
      ADD COLUMN "name" character varying(255)
    `);
  }
}
