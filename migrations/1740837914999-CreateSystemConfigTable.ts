import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSystemConfigTable1740837914999 implements MigrationInterface {
    name = 'CreateSystemConfigTable1740837914999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "system_configuration" ("key" character varying NOT NULL, "string_value" character varying, "number_value" numeric(14,4), "boolean_value" boolean, "json_value" jsonb, CONSTRAINT "PK_5e8c14e0018c85cac099865aa17" PRIMARY KEY ("key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "system_configuration"`);
    }

}
