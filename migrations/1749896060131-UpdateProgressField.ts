import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProgressField1749896060131 implements MigrationInterface {
  name = 'UpdateProgressField1749896060131';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "progress" ADD "config" jsonb`);
    await queryRunner.query(`ALTER TABLE "progress" ADD "logs" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "progress" DROP COLUMN "logs"`);
    await queryRunner.query(`ALTER TABLE "progress" DROP COLUMN "config"`);
  }
}
