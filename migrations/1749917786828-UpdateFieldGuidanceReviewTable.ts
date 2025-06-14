import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFieldGuidanceReviewTable1749917786828 implements MigrationInterface {
  name = 'UpdateFieldGuidanceReviewTable1749917786828';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guidance_reviews" DROP COLUMN "response_accuracy_point"`);
    await queryRunner.query(
      `ALTER TABLE "guidance_reviews" DROP COLUMN "presentation_skills_point"`,
    );
    await queryRunner.query(
      `ALTER TABLE "guidance_reviews" ADD "responsibility_attitude_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "guidance_reviews" ADD "tech_mastery_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "guidance_reviews" ADD "proactiveness_point" double precision`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guidance_reviews" DROP COLUMN "proactiveness_point"`);
    await queryRunner.query(`ALTER TABLE "guidance_reviews" DROP COLUMN "tech_mastery_point"`);
    await queryRunner.query(
      `ALTER TABLE "guidance_reviews" DROP COLUMN "responsibility_attitude_point"`,
    );
    await queryRunner.query(
      `ALTER TABLE "guidance_reviews" ADD "presentation_skills_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "guidance_reviews" ADD "response_accuracy_point" double precision`,
    );
  }
}
