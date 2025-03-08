import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableThesisDocument1741443760555 implements MigrationInterface {
  name = 'AddTableThesisDocument1741443760555';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "assignment_sheets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "full_name" character varying NOT NULL, "mssv" character varying NOT NULL, "student_class_name" character varying, "project_title" character varying, "supervisor" character varying, "phone" character varying, "email" character varying, "class_code" character varying, "input_path" character varying, "output_path" character varying, "semester" character varying, "school" character varying, "thesis_start_date" character varying, "thesis_end_date" character varying, "student_knowledge_gained" text, "technology_gained" text, "acquired_skills" text, "expected_products" text, "real_world_problem_solved" text, "student_sign_date" character varying, "supervisor_sign_date" character varying, "class_id" uuid, CONSTRAINT "PK_1baa70dc87f2b2c46735977dcd3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "guidance_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "supervisor" character varying, "full_name" character varying NOT NULL, "mssv" character varying NOT NULL, "project_title" character varying, "input_path" character varying, "output_path" character varying, "type_of_thesis" character varying, "topic_uniqueness_point" double precision, "workload_point" double precision, "problem_difficulty_point" double precision, "solution_impact_point" double precision, "product_finalization_point" double precision, "layout_coherence_point" double precision, "content_validity_point" double precision, "presentation_quality_point" double precision, "literature_review_point" double precision, "response_accuracy_point" double precision, "presentation_skills_point" double precision, "reward_point" double precision, "general_feedback" text, "conclusion" text, "teacher_sign_date" character varying, "class_id" uuid, CONSTRAINT "PK_8ec4fd4a092bd806eb1696bca64" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "supervisory_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "supervisor" character varying, "full_name" character varying NOT NULL, "mssv" character varying NOT NULL, "project_title" character varying, "input_path" character varying, "output_path" character varying, "class_id" uuid, CONSTRAINT "PK_e3b1f2ae37744fb20587eeaccff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_sheets" ADD CONSTRAINT "FK_83fcc72a30f0b90cca07f43861f" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "guidance_reviews" ADD CONSTRAINT "FK_569d45c76ddf247062a197a65f3" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" ADD CONSTRAINT "FK_c033d558eba588959982d65d493" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supervisory_comments" DROP CONSTRAINT "FK_c033d558eba588959982d65d493"`,
    );
    await queryRunner.query(
      `ALTER TABLE "guidance_reviews" DROP CONSTRAINT "FK_569d45c76ddf247062a197a65f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_sheets" DROP CONSTRAINT "FK_83fcc72a30f0b90cca07f43861f"`,
    );
    await queryRunner.query(`DROP TABLE "supervisory_comments"`);
    await queryRunner.query(`DROP TABLE "guidance_reviews"`);
    await queryRunner.query(`DROP TABLE "assignment_sheets"`);
  }
}
