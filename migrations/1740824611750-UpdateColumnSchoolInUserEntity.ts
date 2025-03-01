import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateColumnSchoolInUserEntity1740824611750 implements MigrationInterface {
    name = 'UpdateColumnSchoolInUserEntity1740824611750'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "schoolName" TO "school"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "school" TO "schoolName"`);
    }

}
