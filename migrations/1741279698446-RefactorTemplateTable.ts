import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorTemplateTable1741279698446 implements MigrationInterface {
  name = 'RefactorTemplateTable1741279698446';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "template_specifications" DROP COLUMN "file_type"`);
    await queryRunner.query(`ALTER TABLE "template_specifications" DROP COLUMN "template"`);
    await queryRunner.query(`ALTER TABLE "template_specifications" DROP COLUMN "json_mapping"`);
    await queryRunner.query(
      `ALTER TABLE "template_specifications" ADD "action" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_specifications" ADD "template_file" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_specifications" ADD "json_file" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "classes" ADD "student_paths" character varying array`);
    await queryRunner.query(
      `ALTER TABLE "template_specifications" DROP CONSTRAINT "FK_c50f293e23366f757b22ac1428e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_specifications" ALTER COLUMN "class_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_specifications" ADD CONSTRAINT "FK_c50f293e23366f757b22ac1428e" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template_specifications" DROP CONSTRAINT "FK_c50f293e23366f757b22ac1428e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_specifications" ALTER COLUMN "class_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_specifications" ADD CONSTRAINT "FK_c50f293e23366f757b22ac1428e" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "classes" DROP COLUMN "student_paths"`);
    await queryRunner.query(`ALTER TABLE "template_specifications" DROP COLUMN "json_file"`);
    await queryRunner.query(`ALTER TABLE "template_specifications" DROP COLUMN "template_file"`);
    await queryRunner.query(`ALTER TABLE "template_specifications" DROP COLUMN "action"`);
    await queryRunner.query(
      `ALTER TABLE "template_specifications" ADD "json_mapping" jsonb NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "template_specifications" ADD "template" jsonb NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "template_specifications" ADD "file_type" character varying NOT NULL`,
    );
  }
}
