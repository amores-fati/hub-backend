import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorDisabilitiesToNtoN1778900000000 implements MigrationInterface {
  name = 'RefactorDisabilitiesToNtoN1778900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "disability" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_disability" PRIMARY KEY ("id"),
        CONSTRAINT "uq_disability__name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "student_disability" (
        "student_id" uuid NOT NULL,
        "disability_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_student_disability" PRIMARY KEY ("student_id", "disability_id"),
        CONSTRAINT "fk_student_disability__student_id__students"
          FOREIGN KEY ("student_id") REFERENCES "students"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "fk_student_disability__disability_id__disability"
          FOREIGN KEY ("disability_id") REFERENCES "disability"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      INSERT INTO "disability" ("id", "name", "created_at", "updated_at")
      SELECT DISTINCT uuid_generate_v4(), TRIM(unnested.value), NOW(), NOW()
      FROM "disabilities",
      LATERAL unnest(string_to_array("type", ',')) AS unnested(value)
      WHERE "type" IS NOT NULL AND TRIM(unnested.value) <> ''
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "student_disability" ("student_id", "disability_id", "created_at", "updated_at")
      SELECT d_old.student_id, d_new.id, NOW(), NOW()
      FROM "disabilities" d_old,
      LATERAL unnest(string_to_array(d_old."type", ',')) AS unnested(value)
      JOIN "disability" d_new ON d_new.name = TRIM(unnested.value)
      WHERE d_old."type" IS NOT NULL
        AND d_old.has_disability = true
        AND TRIM(unnested.value) <> ''
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`DROP TABLE "disabilities"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "disabilities" (
        "student_id" uuid NOT NULL,
        "has_disability" boolean NOT NULL DEFAULT false,
        "type" varchar,
        CONSTRAINT "pk_disabilities" PRIMARY KEY ("student_id"),
        CONSTRAINT "fk_disabilities__student_id__students"
          FOREIGN KEY ("student_id") REFERENCES "students"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      INSERT INTO "disabilities" ("student_id", "has_disability", "type")
      SELECT
        sd.student_id,
        true,
        STRING_AGG(d.name, ',')
      FROM "student_disability" sd
      JOIN "disability" d ON d.id = sd.disability_id
      GROUP BY sd.student_id
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`DROP TABLE "student_disability"`);
    await queryRunner.query(`DROP TABLE "disability"`);
  }
}
