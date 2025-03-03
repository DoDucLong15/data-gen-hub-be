import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitRolesTable1705863452002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO roles (name) VALUES ('admin'), ('teacher');`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM roles;`);
  }
}
