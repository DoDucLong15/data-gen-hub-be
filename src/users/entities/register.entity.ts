import { AbstractAuditingEntity } from '../../base/entities/abstract-auditing-entity';
import { Column, Entity } from 'typeorm';

@Entity('registers')
export class RegisterEntity extends AbstractAuditingEntity {
  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  school: string;

  @Column({ type: 'varchar', nullable: true })
  department: string;

  @Column({ type: 'varchar', nullable: true })
  position: string;
}
