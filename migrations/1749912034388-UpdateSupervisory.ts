import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSupervisory1749912034388 implements MigrationInterface {
  name = 'UpdateSupervisory1749912034388';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "type_of_thesis" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "topic_uniqueness_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "workload_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "problem_difficulty_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "solution_impact_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "product_finalization_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "layout_coherence_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "content_validity_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "presentation_quality_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "literature_review_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "response_accuracy_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "presentation_skills_point" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "reward_point" double precision`,
    );
    await queryRunner.query(`ALTER TABLE "supervisory_comments" ADD "general_feedback" text`);
    await queryRunner.query(`ALTER TABLE "supervisory_comments" ADD "conclusion" text`);
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD "teacher_sign_date" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "supervisory_comments" DROP COLUMN "teacher_sign_date"`);
    await queryRunner.query(`ALTER TABLE "supervisory_comments" DROP COLUMN "conclusion"`);
    await queryRunner.query(`ALTER TABLE "supervisory_comments" DROP COLUMN "general_feedback"`);
    await queryRunner.query(`ALTER TABLE "supervisory_comments" DROP COLUMN "reward_point"`);
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" DROP COLUMN "presentation_skills_point"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" DROP COLUMN "response_accuracy_point"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" DROP COLUMN "literature_review_point"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" DROP COLUMN "presentation_quality_point"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" DROP COLUMN "content_validity_point"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" DROP COLUMN "layout_coherence_point"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" DROP COLUMN "product_finalization_point"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" DROP COLUMN "solution_impact_point"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" DROP COLUMN "problem_difficulty_point"`,
    );
    await queryRunner.query(`ALTER TABLE "supervisory_comments" DROP COLUMN "workload_point"`);
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" DROP COLUMN "topic_uniqueness_point"`,
    );
    await queryRunner.query(`ALTER TABLE "supervisory_comments" DROP COLUMN "type_of_thesis"`);
  }
}
