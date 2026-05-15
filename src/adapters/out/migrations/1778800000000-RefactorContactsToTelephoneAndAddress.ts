import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorContactsToTelephoneAndAddress1778800000000
  implements MigrationInterface
{
  name = 'RefactorContactsToTelephoneAndAddress1778800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "telephone_student" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "phone" varchar(20) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_telephone_student" PRIMARY KEY ("id"),
        CONSTRAINT "uq_telephone_student__student_id" UNIQUE ("student_id"),
        CONSTRAINT "fk_telephone_student__student_id__students"
          FOREIGN KEY ("student_id") REFERENCES "students"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "telephone_company" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "phone" varchar(20) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_telephone_company" PRIMARY KEY ("id"),
        CONSTRAINT "uq_telephone_company__company_id" UNIQUE ("company_id"),
        CONSTRAINT "fk_telephone_company__company_id__companies"
          FOREIGN KEY ("company_id") REFERENCES "companies"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "address_student" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "neighbourhood" varchar,
        "state" char(2),
        "city" varchar(100),
        "address" varchar(255),
        "cep" varchar(9),
        "complement" varchar(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_address_student" PRIMARY KEY ("id"),
        CONSTRAINT "uq_address_student__student_id" UNIQUE ("student_id"),
        CONSTRAINT "fk_address_student__student_id__students"
          FOREIGN KEY ("student_id") REFERENCES "students"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "address_company" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "neighbourhood" varchar,
        "state" char(2),
        "city" varchar(100),
        "address" varchar(255),
        "cep" varchar(9),
        "complement" varchar(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_address_company" PRIMARY KEY ("id"),
        CONSTRAINT "uq_address_company__company_id" UNIQUE ("company_id"),
        CONSTRAINT "fk_address_company__company_id__companies"
          FOREIGN KEY ("company_id") REFERENCES "companies"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      INSERT INTO "telephone_student" ("id", "student_id", "phone", "created_at", "updated_at")
      SELECT uuid_generate_v4(), s.id, c.phone, NOW(), NOW()
      FROM "students" s
      JOIN "contacts" c ON c.id = s.contact_id
      WHERE s.contact_id IS NOT NULL
    `);

    await queryRunner.query(`
      INSERT INTO "telephone_company" ("id", "company_id", "phone", "created_at", "updated_at")
      SELECT uuid_generate_v4(), co.id, c.phone, NOW(), NOW()
      FROM "companies" co
      JOIN "contacts" c ON c.id = co.contact_id
      WHERE co.contact_id IS NOT NULL
    `);

    await queryRunner.query(`
      INSERT INTO "address_student" ("id", "student_id", "neighbourhood", "state", "city", "address", "cep", "complement", "created_at", "updated_at")
      SELECT uuid_generate_v4(), s.id, c.neighbourhood, c.state, c.city, c.address, c.cep, c.complement, NOW(), NOW()
      FROM "students" s
      JOIN "contacts" c ON c.id = s.contact_id
      WHERE s.contact_id IS NOT NULL
    `);

    await queryRunner.query(`
      INSERT INTO "address_company" ("id", "company_id", "neighbourhood", "state", "city", "address", "cep", "complement", "created_at", "updated_at")
      SELECT uuid_generate_v4(), co.id, c.neighbourhood, c.state, c.city, c.address, c.cep, c.complement, NOW(), NOW()
      FROM "companies" co
      JOIN "contacts" c ON c.id = co.contact_id
      WHERE co.contact_id IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "students"
      DROP CONSTRAINT IF EXISTS "fk_students__contact_id__contacts"
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      DROP CONSTRAINT IF EXISTS "uq_students__contact_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "students" DROP COLUMN "contact_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP CONSTRAINT IF EXISTS "fk_companies__contact_id__contacts"
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP CONSTRAINT IF EXISTS "uq_companies__contact_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "companies" DROP COLUMN "contact_id"
    `);

    await queryRunner.query(`DROP TABLE "contacts"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "contacts" (
        "id" uuid NOT NULL,
        "phone" varchar(20) NOT NULL,
        "neighbourhood" varchar,
        "state" char(2),
        "city" varchar(100),
        "address" varchar(255),
        "cep" varchar(9),
        "complement" varchar(255),
        CONSTRAINT "pk_contacts" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "students" ADD COLUMN "contact_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "companies" ADD COLUMN "contact_id" uuid
    `);

    await queryRunner.query(`
      INSERT INTO "contacts" ("id", "phone", "neighbourhood", "state", "city", "address", "cep", "complement")
      SELECT uuid_generate_v4(), ts.phone, addr.neighbourhood, addr.state, addr.city, addr.address, addr.cep, addr.complement
      FROM "telephone_student" ts
      LEFT JOIN "address_student" addr ON addr.student_id = ts.student_id
    `);

    await queryRunner.query(`
      UPDATE "students" s
      SET "contact_id" = c.id
      FROM "telephone_student" ts
      JOIN "contacts" c ON c.phone = ts.phone
      WHERE s.id = ts.student_id
    `);

    await queryRunner.query(`
      INSERT INTO "contacts" ("id", "phone", "neighbourhood", "state", "city", "address", "cep", "complement")
      SELECT uuid_generate_v4(), tc.phone, addr.neighbourhood, addr.state, addr.city, addr.address, addr.cep, addr.complement
      FROM "telephone_company" tc
      LEFT JOIN "address_company" addr ON addr.company_id = tc.company_id
    `);

    await queryRunner.query(`
      UPDATE "companies" co
      SET "contact_id" = c.id
      FROM "telephone_company" tc
      JOIN "contacts" c ON c.phone = tc.phone
      WHERE co.id = tc.company_id
    `);

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "fk_students__contact_id__contacts"
      FOREIGN KEY ("contact_id") REFERENCES "contacts"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "fk_companies__contact_id__contacts"
      FOREIGN KEY ("contact_id") REFERENCES "contacts"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`DROP TABLE "address_company"`);
    await queryRunner.query(`DROP TABLE "address_student"`);
    await queryRunner.query(`DROP TABLE "telephone_company"`);
    await queryRunner.query(`DROP TABLE "telephone_student"`);
  }
}