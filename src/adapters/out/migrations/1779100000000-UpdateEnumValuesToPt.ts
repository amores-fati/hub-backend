import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEnumValuesToPtBR1779100000000
  implements MigrationInterface
{
  name = 'UpdateEnumValuesToPtBR1779100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "ck_users__role"`,
    );

    await queryRunner.query(
      `UPDATE "users" SET "role" = 'ADMINISTRADOR' WHERE "role" = 'ADMIN'`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'ESTUDANTE' WHERE "role" = 'STUDENT'`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'EMPRESA' WHERE "role" = 'COMPANY'`,
    );

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "ck_users__role"
      CHECK ("role" IN ('ADMINISTRADOR', 'ESTUDANTE', 'EMPRESA'))
    `);

    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__gender"`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "gender" = 'MASCULINO' WHERE "gender" = 'MALE'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "gender" = 'FEMININO' WHERE "gender" = 'FEMALE'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "gender" = 'NAO_BINARIO' WHERE "gender" = 'NON_BINARY'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "gender" = 'PREFIRO_NAO_DIZER' WHERE "gender" = 'PREFER_NOT_TO_SAY'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "gender" = 'OUTRO' WHERE "gender" = 'OTHER'`,
    );

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__gender"
      CHECK ("gender" IN ('MASCULINO', 'FEMININO', 'NAO_BINARIO', 'PREFIRO_NAO_DIZER', 'OUTRO'))
    `);


    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__race"`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "race" = 'BRANCO' WHERE "race" = 'WHITE'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "race" = 'PRETO' WHERE "race" = 'BLACK'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "race" = 'PARDO' WHERE "race" = 'BROWN'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "race" = 'INDIGENA' WHERE "race" = 'INDIGENOUS'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "race" = 'PREFIRO_NAO_DIZER' WHERE "race" = 'PREFER_NOT_TO_SAY'`,
    );

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__race"
      CHECK ("race" IN ('BRANCO', 'PRETO', 'PARDO', 'INDIGENA', 'AMARELO', 'PREFIRO_NAO_DIZER'))
    `);

    // =====================================================================
    // students.education
    // =====================================================================

    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__education"`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "education" = 'SEM_ESCOLARIDADE' WHERE "education" = 'NO_EDUCATION'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "education" = 'FUNDAMENTAL' WHERE "education" = 'PRIMARY'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "education" = 'MEDIO' WHERE "education" = 'SECONDARY'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "education" = 'SUPERIOR' WHERE "education" = 'HIGHER'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "education" = 'POS_GRADUACAO' WHERE "education" = 'POSTGRADUATE'`,
    );

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__education"
      CHECK ("education" IS NULL OR "education" IN ('SEM_ESCOLARIDADE', 'FUNDAMENTAL', 'MEDIO', 'SUPERIOR', 'POS_GRADUACAO'))
    `);


    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__how_heard"`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "how_heard" = 'INDICACAO' WHERE "how_heard" = 'REFEREE'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "how_heard" = 'OUTROS' WHERE "how_heard" = 'OTHERS'`,
    );

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__how_heard"
      CHECK ("how_heard" IS NULL OR "how_heard" IN ('INSTAGRAM', 'INDICACAO', 'LINKEDIN', 'OUTROS'))
    `);

    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__family_income"`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "family_income" = 'ATE_1_SALARIO' WHERE "family_income" = 'TO1_SALARY'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "family_income" = 'ENTRE_1_E_3' WHERE "family_income" = 'BETWEEN_1_3'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "family_income" = 'MAIS_DE_3' WHERE "family_income" = 'MORE_THAN_3'`,
    );

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__family_income"
      CHECK ("family_income" IS NULL OR "family_income" IN ('ATE_1_SALARIO', 'ENTRE_1_E_3', 'MAIS_DE_3'))
    `);

    
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "ck_enrollments__type"`,
    );

    await queryRunner.query(
      `UPDATE "enrollments" SET "type" = 'INSCRICAO' WHERE "type" = 'ENROLLMENT'`,
    );
    await queryRunner.query(
      `UPDATE "enrollments" SET "type" = 'INTERESSE' WHERE "type" = 'INTEREST'`,
    );

    await queryRunner.query(`
      ALTER TABLE "enrollments"
      ADD CONSTRAINT "ck_enrollments__type"
      CHECK ("type" IN ('INSCRICAO', 'INTERESSE'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
 
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "ck_enrollments__type"`,
    );

    await queryRunner.query(
      `UPDATE "enrollments" SET "type" = 'ENROLLMENT' WHERE "type" = 'INSCRICAO'`,
    );
    await queryRunner.query(
      `UPDATE "enrollments" SET "type" = 'INTEREST' WHERE "type" = 'INTERESSE'`,
    );

    await queryRunner.query(`
      ALTER TABLE "enrollments"
      ADD CONSTRAINT "ck_enrollments__type"
      CHECK ("type" IN ('ENROLLMENT', 'INTEREST'))
    `);


    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__family_income"`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "family_income" = 'TO1_SALARY' WHERE "family_income" = 'ATE_1_SALARIO'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "family_income" = 'BETWEEN_1_3' WHERE "family_income" = 'ENTRE_1_E_3'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "family_income" = 'MORE_THAN_3' WHERE "family_income" = 'MAIS_DE_3'`,
    );

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__family_income"
      CHECK ("family_income" IS NULL OR "family_income" IN ('TO1_SALARY', 'BETWEEN_1_3', 'MORE_THAN_3'))
    `);


    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__how_heard"`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "how_heard" = 'REFEREE' WHERE "how_heard" = 'INDICACAO'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "how_heard" = 'OTHERS' WHERE "how_heard" = 'OUTROS'`,
    );

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__how_heard"
      CHECK ("how_heard" IS NULL OR "how_heard" IN ('INSTAGRAM', 'REFEREE', 'LINKEDIN', 'OTHERS'))
    `);


    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__education"`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "education" = 'NO_EDUCATION' WHERE "education" = 'SEM_ESCOLARIDADE'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "education" = 'PRIMARY' WHERE "education" = 'FUNDAMENTAL'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "education" = 'SECONDARY' WHERE "education" = 'MEDIO'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "education" = 'HIGHER' WHERE "education" = 'SUPERIOR'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "education" = 'POSTGRADUATE' WHERE "education" = 'POS_GRADUACAO'`,
    );

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__education"
      CHECK ("education" IS NULL OR "education" IN ('NO_EDUCATION', 'PRIMARY', 'SECONDARY', 'HIGHER', 'POSTGRADUATE'))
    `);


    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__race"`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "race" = 'WHITE' WHERE "race" = 'BRANCO'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "race" = 'BLACK' WHERE "race" = 'PRETO'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "race" = 'BROWN' WHERE "race" = 'PARDO'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "race" = 'INDIGENOUS' WHERE "race" = 'INDIGENA'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "race" = 'PREFER_NOT_TO_SAY' WHERE "race" = 'PREFIRO_NAO_DIZER'`,
    );
    // AMARELO had no equivalent before — set to PREFER_NOT_TO_SAY as fallback
    await queryRunner.query(
      `UPDATE "students" SET "race" = 'PREFER_NOT_TO_SAY' WHERE "race" = 'AMARELO'`,
    );

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__race"
      CHECK ("race" IN ('WHITE', 'BLACK', 'BROWN', 'INDIGENOUS', 'PREFER_NOT_TO_SAY'))
    `);


    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "ck_students__gender"`,
    );

    await queryRunner.query(
      `UPDATE "students" SET "gender" = 'MALE' WHERE "gender" = 'MASCULINO'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "gender" = 'FEMALE' WHERE "gender" = 'FEMININO'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "gender" = 'NON_BINARY' WHERE "gender" = 'NAO_BINARIO'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "gender" = 'PREFER_NOT_TO_SAY' WHERE "gender" = 'PREFIRO_NAO_DIZER'`,
    );
    await queryRunner.query(
      `UPDATE "students" SET "gender" = 'OTHER' WHERE "gender" = 'OUTRO'`,
    );

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "ck_students__gender"
      CHECK ("gender" IN ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY', 'OTHER'))
    `);


    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "ck_users__role"`,
    );

    await queryRunner.query(
      `UPDATE "users" SET "role" = 'ADMIN' WHERE "role" = 'ADMINISTRADOR'`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'STUDENT' WHERE "role" = 'ESTUDANTE'`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'COMPANY' WHERE "role" = 'EMPRESA'`,
    );

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "ck_users__role"
      CHECK ("role" IN ('ADMIN', 'STUDENT', 'COMPANY'))
    `);
  }
}