import { MigrationInterface, QueryRunner } from 'typeorm';

export class FieldOfExpertiseAssign1751810886146 implements MigrationInterface {
  name = 'FieldOfExpertiseAssign1751810886146';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment_sheets" ADD "field_of_expertise" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assignment_sheets" DROP COLUMN "field_of_expertise"`);
  }
}
