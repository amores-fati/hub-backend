import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1776384000000 implements MigrationInterface {
  name = 'InitialSchema1776384000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "email" character varying(100) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" character varying(20) NOT NULL,
        CONSTRAINT "pk_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users__email" UNIQUE ("email"),
        CONSTRAINT "ck_users__role" CHECK ("role" IN ('ADMIN', 'STUDENT', 'COMPANY'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "contacts" (
        "id" uuid NOT NULL,
        "name" character varying(255),
        "phone" character varying(20) NOT NULL,
        "country" character varying(100),
        "neighbourhood" character varying,
        "state" character(2),
        "city" character varying(100),
        "address" character varying(255),
        "cep" character varying(9),
        "complement" character varying(255),
        CONSTRAINT "pk_contacts" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "courses" (
        "id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "banner" character varying NOT NULL,
        "description" text,
        "course_load" character varying NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "start_registrations" date NOT NULL,
        "end_registrations" date NOT NULL,
        "link_access" character varying NOT NULL,
        CONSTRAINT "pk_courses" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "skills" (
        "id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        CONSTRAINT "pk_skills" PRIMARY KEY ("id"),
        CONSTRAINT "uq_skills__name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "admins" (
        "id" uuid NOT NULL,
        CONSTRAINT "pk_admins" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "students" (
        "id" uuid NOT NULL,
        "contact_id" uuid,
        "cpf" character varying NOT NULL,
        "social_name" character varying,
        "date_of_birth" date,
        "gender" character varying,
        "gender_other" character varying,
        "race" character varying,
        "education" character varying,
        "course_name" character varying,
        "institution" character varying,
        "activity_area" character varying,
        "has_programming_experience" boolean,
        "has_technology_course" boolean,
        "technology_courses_list" text,
        "send_curriculum" boolean NOT NULL DEFAULT false,
        "motivation" text,
        "how_heard" character varying,
        "has_computer" boolean,
        "has_internet" boolean,
        "committed_to_participate" boolean,
        CONSTRAINT "pk_students" PRIMARY KEY ("id"),
        CONSTRAINT "uq_students__contact_id" UNIQUE ("contact_id"),
        CONSTRAINT "uq_students__cpf" UNIQUE ("cpf")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL,
        "contact_id" uuid,
        "cnpj" character varying(18) NOT NULL,
        "name" character varying(100) NOT NULL,
        "responsible_name" character varying(100) NOT NULL,
        CONSTRAINT "pk_companies" PRIMARY KEY ("id"),
        CONSTRAINT "uq_companies__contact_id" UNIQUE ("contact_id"),
        CONSTRAINT "uq_companies__cnpj" UNIQUE ("cnpj")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "disabilities" (
        "student_id" uuid NOT NULL,
        "has_disability" boolean NOT NULL DEFAULT false,
        "description" text,
        "has_report" character varying,
        "type" character varying,
        CONSTRAINT "pk_disabilities" PRIMARY KEY ("student_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "accessibility_resources" (
        "id" SERIAL NOT NULL,
        "student_id" uuid NOT NULL,
        "resource" character varying NOT NULL,
        "resource_other" character varying(100),
        CONSTRAINT "pk_accessibility_resources" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "social_benefits" (
        "id" SERIAL NOT NULL,
        "student_id" uuid NOT NULL,
        "benefit" character varying NOT NULL,
        "benefit_other" character varying(100),
        CONSTRAINT "pk_social_benefits" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "curriculum" (
        "id" uuid NOT NULL,
        "is_available" boolean NOT NULL,
        "about" text,
        "linkedin" character varying NOT NULL,
        "github" character varying NOT NULL,
        "profile_photo" character varying,
        "video_presentation" character varying NOT NULL,
        "student_id" uuid,
        CONSTRAINT "pk_curriculum" PRIMARY KEY ("id"),
        CONSTRAINT "uq_curriculum__student_id" UNIQUE ("student_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "job_openings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "openings_count" integer NOT NULL DEFAULT 1,
        "application_link" character varying(255),
        "is_pcd" boolean NOT NULL DEFAULT false,
        CONSTRAINT "pk_job_openings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "job_skills" (
        "job_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
        CONSTRAINT "pk_job_skills" PRIMARY KEY ("job_id", "skill_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "curriculum_skills" (
        "curriculum_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
        CONSTRAINT "pk_curriculum_skills" PRIMARY KEY ("curriculum_id", "skill_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "in_person_course_details" (
        "id" uuid NOT NULL,
        "address" character varying NOT NULL,
        "start_date" date NOT NULL,
        "shift" character varying NOT NULL,
        "room" character varying NOT NULL,
        "vacancies" integer NOT NULL,
        "course_id" uuid,
        CONSTRAINT "pk_in_person_course_details" PRIMARY KEY ("id"),
        CONSTRAINT "uq_in_person_course_details__course_id" UNIQUE ("course_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "admins"
      ADD CONSTRAINT "fk_admins__id__users"
      FOREIGN KEY ("id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "fk_students__id__users"
      FOREIGN KEY ("id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "fk_students__contact_id__contacts"
      FOREIGN KEY ("contact_id") REFERENCES "contacts"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "fk_companies__id__users"
      FOREIGN KEY ("id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "fk_companies__contact_id__contacts"
      FOREIGN KEY ("contact_id") REFERENCES "contacts"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "disabilities"
      ADD CONSTRAINT "fk_disabilities__student_id__students"
      FOREIGN KEY ("student_id") REFERENCES "students"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "accessibility_resources"
      ADD CONSTRAINT "fk_accessibility_resources__student_id__students"
      FOREIGN KEY ("student_id") REFERENCES "students"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "social_benefits"
      ADD CONSTRAINT "fk_social_benefits__student_id__students"
      FOREIGN KEY ("student_id") REFERENCES "students"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum"
      ADD CONSTRAINT "fk_curriculum__student_id__students"
      FOREIGN KEY ("student_id") REFERENCES "students"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "job_openings"
      ADD CONSTRAINT "fk_job_openings__company_id__companies"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "job_skills"
      ADD CONSTRAINT "fk_job_skills__job_id__job_openings"
      FOREIGN KEY ("job_id") REFERENCES "job_openings"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "job_skills"
      ADD CONSTRAINT "fk_job_skills__skill_id__skills"
      FOREIGN KEY ("skill_id") REFERENCES "skills"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum_skills"
      ADD CONSTRAINT "fk_curriculum_skills__curriculum_id__curriculum"
      FOREIGN KEY ("curriculum_id") REFERENCES "curriculum"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum_skills"
      ADD CONSTRAINT "fk_curriculum_skills__skill_id__skills"
      FOREIGN KEY ("skill_id") REFERENCES "skills"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "in_person_course_details"
      ADD CONSTRAINT "fk_in_person_course_details__course_id__courses"
      FOREIGN KEY ("course_id") REFERENCES "courses"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "ix_accessibility_resources__student_id"
      ON "accessibility_resources" ("student_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "ix_social_benefits__student_id"
      ON "social_benefits" ("student_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "ix_job_openings__company_id"
      ON "job_openings" ("company_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "ix_job_skills__skill_id"
      ON "job_skills" ("skill_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "ix_curriculum_skills__skill_id"
      ON "curriculum_skills" ("skill_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "in_person_course_details"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "curriculum_skills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_skills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_openings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "curriculum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "social_benefits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accessibility_resources"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "disabilities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admins"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "skills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "courses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contacts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
