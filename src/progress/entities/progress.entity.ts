import { AbstractAuditingEntity } from '../../base/entities/abstract-auditing-entity';
import { Column, Entity } from 'typeorm';
import { EProgressStatus, EProgressType } from '../constant/progress.const';

@Entity('progress')
export class ProgressEntity extends AbstractAuditingEntity {
  @Column({ type: 'varchar', name: 'process_id' })
  processId: string;

  @Column({ type: 'varchar', name: 'type' })
  type: EProgressType;

  @Column({ type: 'varchar', name: 'status' })
  status: EProgressStatus;

  @Column({ type: 'jsonb', nullable: true })
  error: any;

  @Column({ type: 'varchar', name: 'create_by', default: 'system' })
  createBy: string;

  @Column({ type: 'varchar', nullable: true })
  action: string;

  @Column({ type: 'varchar', name: 'class_id', nullable: true })
  classId: string;
}
