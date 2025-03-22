import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableRegister1742613514048 implements MigrationInterface {
  name = 'AddTableRegister1742613514048';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "registers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "email" character varying NOT NULL, "name" character varying NOT NULL, "phone" character varying, "school" character varying, "department" character varying, "position" character varying, CONSTRAINT "UQ_149c7e722cf9d4739075cb27626" UNIQUE ("email"), CONSTRAINT "PK_c80e46007c1de9f8d1c59b3b9b9" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "registers"`);
  }
}
