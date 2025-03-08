import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnOutputPathClasses1741427315477 implements MigrationInterface {
  name = 'AddColumnOutputPathClasses1741427315477';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "classes" ADD "output_path" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "classes" DROP COLUMN "output_path"`);
  }
}
