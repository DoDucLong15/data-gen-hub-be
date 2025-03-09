import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableProgress1741494439803 implements MigrationInterface {
  name = 'AddTableProgress1741494439803';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "process_id" character varying NOT NULL, "type" character varying NOT NULL, "status" character varying NOT NULL, "error" jsonb, "create_by" character varying NOT NULL DEFAULT 'system', "action" character varying, CONSTRAINT "PK_79abdfd87a688f9de756a162b6f" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "progress"`);
  }
}
