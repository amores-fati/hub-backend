import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurriculumPhotoColumns1781181679458 implements MigrationInterface {
  name = 'AddCurriculumPhotoColumns1781181679458';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student_disability" DROP CONSTRAINT "fk_student_disability__disability_id__disability"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_disability" DROP CONSTRAINT "fk_student_disability__student_id__students"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_social_benefit" DROP CONSTRAINT "fk_student_social_benefit__social_benefit_id__social_benefit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_social_benefit" DROP CONSTRAINT "fk_student_social_benefit__student_id__students"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_openings" DROP CONSTRAINT "ck_job_openings__workplace_type"`,
    );
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "telephone_company" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "telephone_company" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_company" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_company" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "telephone_student" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "telephone_student" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_student" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_student" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "skills" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "skills" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "curriculum_skills" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_skills" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_openings" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_openings" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_skills" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_skills" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_disability" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_disability" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_social_benefit" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_social_benefit" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum" ADD "profile_photo_image" bytea`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum" ADD "profile_photo_mime_type" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "telephone_company" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_company" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" DROP CONSTRAINT "uq_social_benefit__name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ALTER COLUMN "name" TYPE character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ALTER COLUMN "name" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ADD CONSTRAINT "UQ_e0c62574c756f0998a85b040774" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ALTER COLUMN "created_at" TYPE TIMESTAMP USING "created_at"::timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ALTER COLUMN "created_at" SET DEFAULT NOW()`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ALTER COLUMN "updated_at" TYPE TIMESTAMP USING "updated_at"::timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ALTER COLUMN "updated_at" SET DEFAULT NOW()`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" DROP CONSTRAINT "uq_disability__name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ALTER COLUMN "name" TYPE character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ALTER COLUMN "name" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ADD CONSTRAINT "UQ_808b883745bc0ed6c6f5bdea087" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ALTER COLUMN "created_at" TYPE TIMESTAMP USING "created_at"::timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ALTER COLUMN "created_at" SET DEFAULT NOW()`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ALTER COLUMN "updated_at" TYPE TIMESTAMP USING "updated_at"::timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ALTER COLUMN "updated_at" SET DEFAULT NOW()`,
    );
    await queryRunner.query(
      `ALTER TABLE "telephone_student" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_student" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ALTER COLUMN "full_name" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_openings" ALTER COLUMN "announcement_date" SET DEFAULT ('now'::text)::date`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0caea35c00dbcbd38381c24824" ON "student_disability" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_044b6c50cf058cfb372f38fd2c" ON "student_disability" ("disability_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad4d7ef8c703ad43b939915c6f" ON "student_social_benefit" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c3c2bd4da8087454fa86a488f1" ON "student_social_benefit" ("social_benefit_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "student_disability" ADD CONSTRAINT "FK_0caea35c00dbcbd38381c24824e" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_disability" ADD CONSTRAINT "FK_044b6c50cf058cfb372f38fd2c2" FOREIGN KEY ("disability_id") REFERENCES "disability"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_social_benefit" ADD CONSTRAINT "FK_ad4d7ef8c703ad43b939915c6fd" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_social_benefit" ADD CONSTRAINT "FK_c3c2bd4da8087454fa86a488f1c" FOREIGN KEY ("social_benefit_id") REFERENCES "social_benefit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student_social_benefit" DROP CONSTRAINT "FK_c3c2bd4da8087454fa86a488f1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_social_benefit" DROP CONSTRAINT "FK_ad4d7ef8c703ad43b939915c6fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_disability" DROP CONSTRAINT "FK_044b6c50cf058cfb372f38fd2c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_disability" DROP CONSTRAINT "FK_0caea35c00dbcbd38381c24824e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c3c2bd4da8087454fa86a488f1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad4d7ef8c703ad43b939915c6f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_044b6c50cf058cfb372f38fd2c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0caea35c00dbcbd38381c24824"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_openings" ALTER COLUMN "announcement_date" SET DEFAULT CURRENT_DATE`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ALTER COLUMN "full_name" SET DEFAULT 'N/A'`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_student" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "telephone_student" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" DROP CONSTRAINT "UQ_808b883745bc0ed6c6f5bdea087"`,
    );
    await queryRunner.query(`ALTER TABLE "disability" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "disability" ADD "name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ADD CONSTRAINT "uq_disability__name" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "disability" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" DROP CONSTRAINT "UQ_e0c62574c756f0998a85b040774"`,
    );
    await queryRunner.query(`ALTER TABLE "social_benefit" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ADD "name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ADD CONSTRAINT "uq_social_benefit__name" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefit" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_company" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "telephone_company" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum" DROP COLUMN "profile_photo_mime_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum" DROP COLUMN "profile_photo_image"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_social_benefit" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_social_benefit" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_disability" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_disability" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_skills" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_skills" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_openings" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_openings" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_skills" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_skills" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "skills" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_student" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_student" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "telephone_student" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "telephone_student" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_company" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_company" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "telephone_company" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "telephone_company" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_openings" ADD CONSTRAINT "ck_job_openings__workplace_type" CHECK (((workplace_type)::text = ANY ((ARRAY['presencial'::character varying, 'online'::character varying, 'hibrido'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_social_benefit" ADD CONSTRAINT "fk_student_social_benefit__student_id__students" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_social_benefit" ADD CONSTRAINT "fk_student_social_benefit__social_benefit_id__social_benefit" FOREIGN KEY ("social_benefit_id") REFERENCES "social_benefit"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_disability" ADD CONSTRAINT "fk_student_disability__student_id__students" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_disability" ADD CONSTRAINT "fk_student_disability__disability_id__disability" FOREIGN KEY ("disability_id") REFERENCES "disability"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
