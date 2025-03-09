import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnClassIdInProgress1741510979531 implements MigrationInterface {
  name = 'AddColumnClassIdInProgress1741510979531';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "progress" ADD "class_id" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "progress" DROP COLUMN "class_id"`);
  }
}
