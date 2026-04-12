import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIntegrityConstraints1776030000000
  implements MigrationInterface
{
  name = 'AddIntegrityConstraints1776030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accessibility_resources" DROP CONSTRAINT "FK_1dec330e50d930370782ea0fa45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefits" DROP CONSTRAINT "FK_23fbe36fa5035104ab1fd4f1e23"`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "UQ_students_cpf" UNIQUE ("cpf")`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "UQ_companies_cnpj" UNIQUE ("cnpj")`,
    );

    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_students_id_users_id" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "FK_companies_id_users_id" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "accessibility_resources" ADD CONSTRAINT "FK_1dec330e50d930370782ea0fa45" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_benefits" ADD CONSTRAINT "FK_23fbe36fa5035104ab1fd4f1e23" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "social_benefits" DROP CONSTRAINT "FK_23fbe36fa5035104ab1fd4f1e23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessibility_resources" DROP CONSTRAINT "FK_1dec330e50d930370782ea0fa45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP CONSTRAINT "FK_companies_id_users_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_students_id_users_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "companies" DROP CONSTRAINT "UQ_companies_cnpj"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "UQ_students_cpf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_users_email"`,
    );

    await queryRunner.query(
      `ALTER TABLE "social_benefits" ADD CONSTRAINT "FK_23fbe36fa5035104ab1fd4f1e23" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "accessibility_resources" ADD CONSTRAINT "FK_1dec330e50d930370782ea0fa45" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
