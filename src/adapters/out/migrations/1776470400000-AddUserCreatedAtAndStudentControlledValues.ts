import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserCreatedAtAndStudentControlledValues1776470400000
  implements MigrationInterface
{
  name = 'AddUserCreatedAtAndStudentControlledValues1776470400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    `);

    await queryRunner.query(`
      UPDATE "students"
      SET "gender" = CASE
        WHEN "gender" IS NULL THEN NULL
        WHEN LOWER(TRIM("gender")) IN ('male', 'masculino') THEN 'MALE'
        WHEN LOWER(TRIM("gender")) IN ('female', 'feminino') THEN 'FEMALE'
        WHEN LOWER(TRIM("gender")) IN (
          'non_binary',
          'non-binary',
          'nao_binario',
          'nao binario',
          'não_binário',
          'não binário'
        ) THEN 'NON_BINARY'
        WHEN LOWER(TRIM("gender")) IN (
          'prefer_not_to_say',
          'prefiro_nao_informar',
          'prefiro nao informar'
        ) THEN 'PREFER_NOT_TO_SAY'
        WHEN LOWER(TRIM("gender")) = 'other' THEN 'OTHER'
        ELSE 'OTHER'
      END
    `);

    await queryRunner.query(`
      UPDATE "students"
      SET "race" = CASE
        WHEN "race" IS NULL THEN NULL
        WHEN LOWER(TRIM("race")) IN ('white', 'branca') THEN 'WHITE'
        WHEN LOWER(TRIM("race")) IN ('black', 'preta', 'negra') THEN 'BLACK'
        WHEN LOWER(TRIM("race")) IN ('brown', 'parda') THEN 'BROWN'
        WHEN LOWER(TRIM("race")) IN ('indigenous', 'indigena', 'indígena') THEN 'INDIGENOUS'
        WHEN LOWER(TRIM("race")) IN ('asian', 'amarela') THEN 'ASIAN'
        WHEN LOWER(TRIM("race")) IN (
          'prefer_not_to_say',
          'prefiro_nao_informar',
          'prefiro nao informar'
        ) THEN 'PREFER_NOT_TO_SAY'
        WHEN LOWER(TRIM("race")) = 'other' THEN 'OTHER'
        ELSE 'OTHER'
      END
    `);

    await queryRunner.query(`
      UPDATE "students"
      SET "education" = CASE
        WHEN "education" IS NULL THEN NULL
        WHEN LOWER(TRIM("education")) IN (
          'no_formal_education',
          'no_education',
          'sem_escolaridade',
          'sem escolaridade'
        ) THEN 'NO_FORMAL_EDUCATION'
        WHEN LOWER(TRIM("education")) IN (
          'primary',
          'fundamental',
          'ensino_fundamental',
          'ensino fundamental'
        ) THEN 'PRIMARY'
        WHEN LOWER(TRIM("education")) IN (
          'secondary',
          'ensino_medio',
          'ensino medio',
          'medio_completo',
          'médio completo'
        ) THEN 'SECONDARY'
        WHEN LOWER(TRIM("education")) IN (
          'technical',
          'tecnico',
          'técnico'
        ) THEN 'TECHNICAL'
        WHEN LOWER(TRIM("education")) IN ('higher', 'superior') THEN 'HIGHER'
        WHEN LOWER(TRIM("education")) IN (
          'postgraduate',
          'pos_graduacao',
          'pos graduação',
          'pós_graduação'
        ) THEN 'POSTGRADUATE'
        WHEN LOWER(TRIM("education")) = 'other' THEN 'OTHER'
        ELSE 'OTHER'
      END
    `);

    await queryRunner.query(`
      UPDATE "students"
      SET "how_heard" = CASE
        WHEN "how_heard" IS NULL THEN NULL
        WHEN LOWER(TRIM("how_heard")) = 'instagram' THEN 'INSTAGRAM'
        WHEN LOWER(TRIM("how_heard")) IN (
          'referral',
          'indicacao',
          'indicação'
        ) THEN 'REFERRAL'
        WHEN LOWER(TRIM("how_heard")) = 'linkedin' THEN 'LINKEDIN'
        WHEN LOWER(TRIM("how_heard")) = 'google' THEN 'GOOGLE'
        WHEN LOWER(TRIM("how_heard")) IN ('event', 'evento') THEN 'EVENT'
        WHEN LOWER(TRIM("how_heard")) = 'other' THEN 'OTHER'
        ELSE 'OTHER'
      END
    `);

    await queryRunner.query(`
      ALTER TABLE "students"
      DROP CONSTRAINT IF EXISTS "ck_students__gender"
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      DROP CONSTRAINT IF EXISTS "ck_students__race"
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      DROP CONSTRAINT IF EXISTS "ck_students__education"
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      DROP CONSTRAINT IF EXISTS "ck_students__how_heard"
    `);

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__gender"
      CHECK (
        "gender" IS NULL OR
        "gender" IN ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY', 'OTHER')
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__race"
      CHECK (
        "race" IS NULL OR
        "race" IN ('WHITE', 'BLACK', 'BROWN', 'INDIGENOUS', 'ASIAN', 'PREFER_NOT_TO_SAY', 'OTHER')
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__education"
      CHECK (
        "education" IS NULL OR
        "education" IN (
          'NO_FORMAL_EDUCATION',
          'PRIMARY',
          'SECONDARY',
          'TECHNICAL',
          'HIGHER',
          'POSTGRADUATE',
          'OTHER'
        )
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__how_heard"
      CHECK (
        "how_heard" IS NULL OR
        "how_heard" IN ('INSTAGRAM', 'REFERRAL', 'LINKEDIN', 'GOOGLE', 'EVENT', 'OTHER')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
      DROP CONSTRAINT IF EXISTS "ck_students__how_heard"
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      DROP CONSTRAINT IF EXISTS "ck_students__education"
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      DROP CONSTRAINT IF EXISTS "ck_students__race"
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      DROP CONSTRAINT IF EXISTS "ck_students__gender"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "created_at"
    `);
  }
}
