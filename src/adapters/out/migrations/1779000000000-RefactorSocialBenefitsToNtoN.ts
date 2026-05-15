import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorSocialBenefitsToNtoN1779000000000
  implements MigrationInterface
{
  name = 'RefactorSocialBenefitsToNtoN1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- create social_benefit lookup table ---

    await queryRunner.query(`
      CREATE TABLE "social_benefit" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_social_benefit" PRIMARY KEY ("id"),
        CONSTRAINT "uq_social_benefit__name" UNIQUE ("name")
      )
    `);

    // --- create junction table ---

    await queryRunner.query(`
      CREATE TABLE "student_social_benefit" (
        "student_id" uuid NOT NULL,
        "social_benefit_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_student_social_benefit" PRIMARY KEY ("student_id", "social_benefit_id"),
        CONSTRAINT "fk_student_social_benefit__student_id__students"
          FOREIGN KEY ("student_id") REFERENCES "students"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "fk_student_social_benefit__social_benefit_id__social_benefit"
          FOREIGN KEY ("social_benefit_id") REFERENCES "social_benefit"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // --- migrate existing data ---
    // extract unique benefit values from old table into lookup

    await queryRunner.query(`
      INSERT INTO "social_benefit" ("id", "name", "created_at", "updated_at")
      SELECT DISTINCT uuid_generate_v4(), sb.benefit, NOW(), NOW()
      FROM "social_benefits" sb
      WHERE sb.benefit IS NOT NULL
      ON CONFLICT ("name") DO NOTHING
    `);

    // link students to their benefits via junction table

    await queryRunner.query(`
      INSERT INTO "student_social_benefit" ("student_id", "social_benefit_id", "created_at", "updated_at")
      SELECT sb.student_id, sbn.id, NOW(), NOW()
      FROM "social_benefits" sb
      JOIN "social_benefit" sbn ON sbn.name = sb.benefit
      WHERE sb.benefit IS NOT NULL
      ON CONFLICT DO NOTHING
    `);

    // --- drop old social_benefits table ---

    await queryRunner.query(`DROP TABLE "social_benefits"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      CREATE TABLE "social_benefits" (
        "id" SERIAL NOT NULL,
        "student_id" uuid NOT NULL,
        "benefit" varchar NOT NULL,
        CONSTRAINT "pk_social_benefits" PRIMARY KEY ("id"),
        CONSTRAINT "fk_social_benefits__student_id__students"
          FOREIGN KEY ("student_id") REFERENCES "students"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);


    await queryRunner.query(`
      INSERT INTO "social_benefits" ("student_id", "benefit")
      SELECT ssb.student_id, sb.name
      FROM "student_social_benefit" ssb
      JOIN "social_benefit" sb ON sb.id = ssb.social_benefit_id
    `);


    await queryRunner.query(`DROP TABLE "student_social_benefit"`);
    await queryRunner.query(`DROP TABLE "social_benefit"`);
  }
}