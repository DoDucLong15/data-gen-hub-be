import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFieldReviewer1749912975883 implements MigrationInterface {
  name = 'UpdateFieldReviewer1749912975883';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" RENAME COLUMN "supervisor" TO "reviewer"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" RENAME COLUMN "reviewer" TO "supervisor"`,
    );
  }
}
