import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTemplateTable1740847699062 implements MigrationInterface {
    name = 'CreateTemplateTable1740847699062'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "template_specifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "file_type" character varying NOT NULL, "template" jsonb NOT NULL, "json_mapping" jsonb NOT NULL, "class_id" uuid, CONSTRAINT "PK_701e719ee53926368e4fbfedd77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "template_specifications" ADD CONSTRAINT "FK_c50f293e23366f757b22ac1428e" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template_specifications" DROP CONSTRAINT "FK_c50f293e23366f757b22ac1428e"`);
        await queryRunner.query(`DROP TABLE "template_specifications"`);
    }

}
