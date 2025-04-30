import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClassOneDrive1746004508511 implements MigrationInterface {
  name = 'ClassOneDrive1746004508511';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "class_onedrive_infos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "onedrive_shared_link" character varying NOT NULL, "drive_id" character varying NOT NULL, "item_id" character varying NOT NULL, "student_list" jsonb, "assignment_sheets" jsonb, "guidance_reviews" jsonb, "supervisory_comments" jsonb, "class_id" uuid NOT NULL, "last_sync" character varying, CONSTRAINT "REL_c5f3b5215bf5cbed164a2d08a7" UNIQUE ("class_id"), CONSTRAINT "PK_cac864459c0e668fdcda6d3a048" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "classes" ADD "onedrive_shared_link" character varying`);
    await queryRunner.query(
      `ALTER TABLE "class_onedrive_infos" ADD CONSTRAINT "FK_c5f3b5215bf5cbed164a2d08a70" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "class_onedrive_infos" DROP CONSTRAINT "FK_c5f3b5215bf5cbed164a2d08a70"`,
    );
    await queryRunner.query(`ALTER TABLE "classes" DROP COLUMN "onedrive_shared_link"`);
    await queryRunner.query(`DROP TABLE "class_onedrive_infos"`);
  }
}
