import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastSyncColumn1745245469467 implements MigrationInterface {
  name = 'AddLastSyncColumn1745245469467';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "class_drive_infos" ADD "last_sync" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "class_drive_infos" DROP COLUMN "last_sync"`);
  }
}
