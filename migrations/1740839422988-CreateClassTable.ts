import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClassTable1740839422988 implements MigrationInterface {
    name = 'CreateClassTable1740839422988'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "class_code" character varying NOT NULL, "course_code" character varying NOT NULL, "semester" character varying NOT NULL, "teacherId" uuid, CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_4b7ac7a7eb91f3e04229c7c0b6f" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_4b7ac7a7eb91f3e04229c7c0b6f"`);
        await queryRunner.query(`DROP TABLE "classes"`);
    }

}
