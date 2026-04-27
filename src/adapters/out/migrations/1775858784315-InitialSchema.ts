import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1775858784315 implements MigrationInterface {
  name = 'InitialSchema1775858784315';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL, "email" character varying(100) NOT NULL, "password" character varying(100) NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "contacts" ("id" uuid NOT NULL, "phone" character varying(20) NOT NULL, "neighbourhood" character varying, "state" character(2), "city" character varying(100), "address" character varying(255), "cep" character varying(9), "complement" character varying(255), CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "courses" ("id" uuid NOT NULL, "name" character varying NOT NULL, "banner" character varying NOT NULL, "description" text, "course_load" character varying NOT NULL, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "start_registrations" TIMESTAMP NOT NULL, "end_registrations" TIMESTAMP NOT NULL, "link_access" character varying NOT NULL, CONSTRAINT "PK_3f70a44140be2baaa31e21ef375" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "students" ("id" uuid NOT NULL, "cpf" character varying NOT NULL, "social_name" character varying, "date_of_birth" TIMESTAMP, "gender" character varying, "gender_other" character varying, "color" character varying, "education" character varying, "course" character varying, "institution" character varying, "area_activity" character varying, "programming_exp" boolean, "tecnology_course" boolean, "which_courses" text, "send_curriculum" boolean, "motivation" text, "how_know" character varying, "has_computer" boolean, "has_internet" boolean, "compromisse" boolean, "contact_id" uuid, CONSTRAINT "REL_bf10ac3133366a425a3825f168" UNIQUE ("contact_id"), CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "accessibility_resources" ("id" SERIAL NOT NULL, "student_id" uuid NOT NULL, "resource" character varying NOT NULL, "resource_other" character varying(100), CONSTRAINT "PK_4390a3f7b2707e29c38c6361ec5" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "social_benefits" ("id" SERIAL NOT NULL, "student_id" uuid NOT NULL, "benefit" character varying NOT NULL, "benefit_other" character varying(100), CONSTRAINT "PK_0aa7d6943bf1c46423aaa51ab14" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "disabilities" ("student_id" uuid NOT NULL, "has_disability" boolean NOT NULL DEFAULT false, "description" text, "has_report" character varying, "type" character varying, CONSTRAINT "PK_802683ebba1754e8bd9b1cb0555" PRIMARY KEY ("student_id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "curriculums" ("id" uuid NOT NULL, "is_avaliable" boolean NOT NULL, "about" text, "linkedin" character varying NOT NULL, "github" character varying NOT NULL, "profile_photo" character varying, "video_apresentation" character varying NOT NULL, "student_id" uuid, CONSTRAINT "REL_676cb81b59cfa58db274c614ef" UNIQUE ("student_id"), CONSTRAINT "PK_091de2c9968cf577f7bc933cee9" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "companies" ("id" uuid NOT NULL, "cnpj" character varying(18) NOT NULL, "name" character varying(100) NOT NULL, "ownerName" character varying(100) NOT NULL, "contact_id" uuid, CONSTRAINT "REL_57be5fe8aafc63696053efc27f" UNIQUE ("contact_id"), CONSTRAINT "PK_a019e9afe6517b4f2a4588f2cce" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "name" character varying NOT NULL, "description" text, "jobs_number" integer NOT NULL DEFAULT '1', "pcd" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "skills" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, CONSTRAINT "UQ_81f05095507fd84aa2769b4a522" UNIQUE ("name"), CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "skills_job" ("job_id" uuid NOT NULL, "skill_id" uuid NOT NULL, CONSTRAINT "PK_ea74e5d5eaefb24722077ccec20" PRIMARY KEY ("job_id", "skill_id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "skills_curriculum" ("curriculum_id" uuid NOT NULL, "skill_id" uuid NOT NULL, CONSTRAINT "PK_c5b6a03f7ad23bae4c510b089c7" PRIMARY KEY ("curriculum_id", "skill_id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "admins" ("id" uuid NOT NULL, CONSTRAINT "PK_e3b38270c97a854c48d2e80874e" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "person_courses" ("id" uuid NOT NULL, "adress" character varying NOT NULL, "start_date" TIMESTAMP NOT NULL, "shift" character varying NOT NULL, "room" character varying NOT NULL, "vacancies" integer NOT NULL, "courseId" uuid, CONSTRAINT "REL_b202f3d608ced36e970ad201ff" UNIQUE ("courseId"), CONSTRAINT "PK_b57822f498906415d6c378bf09e" PRIMARY KEY ("id"))`,
    );

    // Foreign Keys
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_b99cd40cfd66a99f1571f4f72e6" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessibility_resources" ADD CONSTRAINT "FK_1dec330e50d930370782ea0fa45" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefits" ADD CONSTRAINT "FK_23fbe36fa5035104ab1fd4f1e23" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_bf10ac3133366a425a3825f1685" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "disabilities" ADD CONSTRAINT "FK_802683ebba1754e8bd9b1cb0555" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculums" ADD CONSTRAINT "FK_676cb81b59cfa58db274c614efa" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "FK_57be5fe8aafc63696053efc27f6" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_48970c58b3cbbc677f286cc0af5" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills_job" ADD CONSTRAINT "FK_9ec1a1a7b3c883edde91459a859" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills_job" ADD CONSTRAINT "FK_703020b0c449a63d1c624d8f7d0" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills_curriculum" ADD CONSTRAINT "FK_3d1300dee6b99f55c52e4b8b856" FOREIGN KEY ("curriculum_id") REFERENCES "curriculums"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills_curriculum" ADD CONSTRAINT "FK_7a99bf92fbbc8f38a2b4bfef365" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ADD CONSTRAINT "FK_e3b38270c97a854c48d2e80874e" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "person_courses" ADD CONSTRAINT "FK_b202f3d608ced36e970ad201ffa" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "person_courses" DROP CONSTRAINT "FK_b202f3d608ced36e970ad201ffa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" DROP CONSTRAINT "FK_e3b38270c97a854c48d2e80874e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills_curriculum" DROP CONSTRAINT "FK_7a99bf92fbbc8f38a2b4bfef365"`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills_curriculum" DROP CONSTRAINT "FK_3d1300dee6b99f55c52e4b8b856"`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills_job" DROP CONSTRAINT "FK_703020b0c449a63d1c624d8f7d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills_job" DROP CONSTRAINT "FK_9ec1a1a7b3c883edde91459a859"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_48970c58b3cbbc677f286cc0af5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP CONSTRAINT "FK_57be5fe8aafc63696053efc27f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculums" DROP CONSTRAINT "FK_676cb81b59cfa58db274c614efa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "disabilities" DROP CONSTRAINT "FK_802683ebba1754e8bd9b1cb0555"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_bf10ac3133366a425a3825f1685"`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefits" DROP CONSTRAINT "FK_23fbe36fa5035104ab1fd4f1e23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessibility_resources" DROP CONSTRAINT "FK_1dec330e50d930370782ea0fa45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_b99cd40cfd66a99f1571f4f72e6"`,
    );

    await queryRunner.query(`DROP TABLE "person_courses"`);
    await queryRunner.query(`DROP TABLE "admins"`);
    await queryRunner.query(`DROP TABLE "skills_curriculum"`);
    await queryRunner.query(`DROP TABLE "skills_job"`);
    await queryRunner.query(`DROP TABLE "skills"`);
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TABLE "companies"`);
    await queryRunner.query(`DROP TABLE "curriculums"`);
    await queryRunner.query(`DROP TABLE "disabilities"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TABLE "social_benefits"`);
    await queryRunner.query(`DROP TABLE "accessibility_resources"`);
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TABLE "contacts"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }
}
