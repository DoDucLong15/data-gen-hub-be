import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStudentsTable1740905737751 implements MigrationInterface {
    name = 'CreateStudentsTable1740905737751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "mssv" character varying(50) NOT NULL, "phone" character varying, "email" character varying, "last_name" character varying, "middle_name" character varying, "first_name" character varying, "project_title" character varying, "supervisor" character varying, "reviewer" character varying, "student_class_name" character varying, "class_id" uuid, CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_de6ad4ae6936dce474e2823984e" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_de6ad4ae6936dce474e2823984e"`);
        await queryRunner.query(`DROP TABLE "students"`);
    }

}
