import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RefactorCourse1778800000000 implements MigrationInterface {
  name = 'RefactorCourse1778800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('in_person_course_details', true);

    await queryRunner.addColumn(
      'courses',
      new TableColumn({
        name: 'address',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'courses',
      new TableColumn({
        name: 'shift',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.query('ALTER TABLE "courses" ALTER COLUMN "link_access" DROP NOT NULL;');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "courses" ALTER COLUMN "link_access" SET NOT NULL;');

    await queryRunner.dropColumn('courses', 'shift');
    await queryRunner.dropColumn('courses', 'address');

    // Restore table (simplified)
    await queryRunner.query(`
      CREATE TABLE "in_person_course_details" (
        "id" uuid NOT NULL,
        "address" character varying NOT NULL,
        "start_date" date NOT NULL,
        "shift" character varying NOT NULL,
        "room" character varying NOT NULL,
        "vacancies" integer NOT NULL,
        "course_id" uuid NOT NULL,
        CONSTRAINT "PK_in_person_course_details" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "in_person_course_details" 
      ADD CONSTRAINT "fk_in_person_course_details__course_id__courses" 
      FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }
}
