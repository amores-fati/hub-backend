import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1773969735888 implements MigrationInterface {
  name = 'InitialSchema1773969735888';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL, "email" character varying(100) NOT NULL, "password" character varying(100) NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "courses" ("id" uuid NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contact" ("id" character varying NOT NULL, "phone" character varying(20) NOT NULL, "neighbourhood" character varying, "state" character(2), "city" character varying(100), "address" character varying(255), "cep" character varying(9), "complement" character varying(255), CONSTRAINT "PK_28eb0790e6287c8809467794178" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "companies" ("id" uuid NOT NULL, "cnpj" character varying(18) NOT NULL, "name" character varying(100) NOT NULL, "ownerName" character varying(100) NOT NULL, "contact_id" character varying, CONSTRAINT "PK_d6332ec137f398f658ff9c9a39" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "FK_d6332ec137f398f658ff9c9a39" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "FK_3042079069d3567839352601962" FOREIGN KEY ("contact_id") REFERENCES "contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" DROP CONSTRAINT "FK_3042079069d3567839352601962"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP CONSTRAINT "FK_d6332ec137f398f658ff9c9a39"`,
    );
    await queryRunner.query(`DROP TABLE "companies"`);
    await queryRunner.query(`DROP TABLE "contact"`);
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
