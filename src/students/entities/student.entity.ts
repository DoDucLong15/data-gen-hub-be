import { ClassEntity } from '../../class/entities/class.entity';
import { AbstractAuditingEntity } from '../../base/entities/abstract-auditing-entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Expose } from 'class-transformer';

@Entity('students')
export class StudentEntity extends AbstractAuditingEntity {
  @Column({ type: 'varchar', length: 50 })
  mssv: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', nullable: true, name: 'middle_name' })
  middleName: string;

  @Column({ type: 'varchar', nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', nullable: true, name: 'project_title' })
  projectTitle: string;

  @Column({ type: 'varchar', nullable: true })
  supervisor: string;

  @Column({ type: 'varchar', nullable: true })
  reviewer: string;

  @Column({ type: 'varchar', nullable: true, name: 'student_class_name' })
  studentClassName: string;

  @ManyToOne(() => ClassEntity, (classEntity) => classEntity.students, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @Expose({ name: 'fullName' })
  get fullName(): string {
    return `${this.lastName ?? ''} ${this.middleName ?? ''} ${this.firstName ?? ''}`;
  }
}
