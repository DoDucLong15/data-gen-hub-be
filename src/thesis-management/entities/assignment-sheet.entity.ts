import { ClassEntity } from '../../class/entities/class.entity';
import { AbstractAuditingEntity } from '../../base/entities/abstract-auditing-entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('assignment_sheets')
export class AssignmentSheetsEntity extends AbstractAuditingEntity {
  @Column({ type: 'varchar', name: 'full_name', nullable: false })
  fullName: string;

  @Column({ type: 'varchar', name: 'mssv', nullable: false })
  mssv: string;

  @Column({ type: 'varchar', name: 'student_class_name', nullable: true })
  studentClassName: string;

  @Column({ type: 'varchar', name: 'project_title', nullable: true })
  projectTitle: string;

  @Column({ type: 'varchar', name: 'supervisor', nullable: true })
  supervisor: string;

  @Column({ type: 'varchar', name: 'phone', nullable: true })
  phone: string;

  @Column({ type: 'varchar', name: 'email', nullable: true })
  email: string;

  @Column({ type: 'varchar', name: 'class_code', nullable: true })
  classCode: string;

  @Column({ type: 'varchar', name: 'field_of_expertise', nullable: true })
  fieldOfExpertise: string;

  @Column({ type: 'varchar', name: 'input_path', nullable: true })
  inputPath: string | null;

  @Column({ type: 'varchar', name: 'output_path', nullable: true })
  outputPath: string | null;

  @Column({ type: 'varchar', name: 'semester', nullable: true })
  semester: string;

  @Column({ type: 'varchar', name: 'school', nullable: true })
  school: string;

  @Column({ type: 'varchar', name: 'thesis_start_date', nullable: true })
  thesisStartDate: string;

  @Column({ type: 'varchar', name: 'thesis_end_date', nullable: true })
  thesisEndDate: string;

  @Column({ type: 'text', name: 'student_knowledge_gained', nullable: true })
  studentKnowledgeGained: string;

  @Column({ type: 'text', name: 'technology_gained', nullable: true })
  technologyGained: string;

  @Column({ type: 'text', name: 'acquired_skills', nullable: true })
  acquiredSkills: string;

  @Column({ type: 'text', name: 'expected_products', nullable: true })
  expectedProducts: string;

  @Column({ type: 'text', name: 'real_world_problem_solved', nullable: true })
  realWorldProblemSolved: string;

  @Column({ type: 'varchar', name: 'student_sign_date', nullable: true })
  student_sign_date: string;

  @Column({ type: 'varchar', name: 'supervisor_sign_date', nullable: true })
  supervisor_sign_date: string;

  @ManyToOne(() => ClassEntity, (classEntity) => classEntity.assignmentSheets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;
}
