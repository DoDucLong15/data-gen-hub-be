import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableClassDriveInfo1743240356400 implements MigrationInterface {
  name = 'AddTableClassDriveInfo1743240356400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "class_drive_infos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "drive_id" character varying NOT NULL, "student_list" jsonb, "assignment_sheets" jsonb, "guidance_reviews" jsonb, "supervisory_comments" jsonb, "class_id" uuid NOT NULL, CONSTRAINT "REL_7da37320545b0bdd9f821bcfa6" UNIQUE ("class_id"), CONSTRAINT "PK_d05646bdca2cf9009f3d3377df6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "classes" ADD "drive_id" character varying`);
    await queryRunner.query(
      `ALTER TABLE "class_drive_infos" ADD CONSTRAINT "FK_7da37320545b0bdd9f821bcfa64" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "class_drive_infos" DROP CONSTRAINT "FK_7da37320545b0bdd9f821bcfa64"`,
    );
    await queryRunner.query(`ALTER TABLE "classes" DROP COLUMN "drive_id"`);
    await queryRunner.query(`DROP TABLE "class_drive_infos"`);
  }
}
