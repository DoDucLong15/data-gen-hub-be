import { ClassEntity } from '../../class/entities/class.entity';
import { AbstractAuditingEntity } from '../../base/entities/abstract-auditing-entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('supervisory_comments')
export class SupervisoryCommentsEntity extends AbstractAuditingEntity {
  @Column({ type: 'varchar', name: 'supervisor', nullable: true })
  supervisor: string;

  @Column({ type: 'varchar', name: 'full_name', nullable: false })
  fullName: string;

  @Column({ type: 'varchar', name: 'mssv', nullable: false })
  mssv: string;

  @Column({ type: 'varchar', name: 'project_title', nullable: true })
  projectTitle: string;

  @Column({ type: 'varchar', name: 'input_path', nullable: true })
  inputPath: string | null;

  @Column({ type: 'varchar', name: 'output_path', nullable: true })
  outputPath: string | null;

  @ManyToOne(() => ClassEntity, (classEntity) => classEntity.supervisoryComments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;
}
