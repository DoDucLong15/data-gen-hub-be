import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnDescriptionRole1741792637271 implements MigrationInterface {
  name = 'AddColumnDescriptionRole1741792637271';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" ADD "description" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "description"`);
  }
}
