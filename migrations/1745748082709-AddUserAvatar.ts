import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAvatar1745748082709 implements MigrationInterface {
  name = 'AddUserAvatar1745748082709';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
  }
}
