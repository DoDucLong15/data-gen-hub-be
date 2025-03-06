import { AbstractAuditingEntity } from '../../base/entities/abstract-auditing-entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ClassEntity } from '../../class/entities/class.entity';
import { ActionEnum } from '../enums/action.enum';
import { Exclude } from 'class-transformer';

@Entity('template_specifications')
export class TemplateSpecificationEntity extends AbstractAuditingEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  action: ActionEnum;

  @Column({ type: 'varchar', name: 'template_file', nullable: true })
  templateFile: string;

  @Column({ type: 'varchar', name: 'json_file' })
  jsonFile: string;

  @ManyToOne(() => ClassEntity, (classEntity) => classEntity.templateSpecifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar', name: 'class_id' })
  classId: string;
}
