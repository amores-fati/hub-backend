import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDefaultToCreatedAt1781202084034 implements MigrationInterface {
    name = 'AddDefaultToCreatedAt1781202084034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "social_benefit" ALTER COLUMN "created_at" SET DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE "social_benefit" ALTER COLUMN "updated_at" SET DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE "disability" ALTER COLUMN "created_at" SET DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE "disability" ALTER COLUMN "updated_at" SET DEFAULT NOW()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "disability" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "disability" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "social_benefit" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "social_benefit" ALTER COLUMN "created_at" DROP DEFAULT`);
    }

}
