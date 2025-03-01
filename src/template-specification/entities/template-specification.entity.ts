import { AbstractAuditingEntity } from "../../base/entities/abstract-auditing-entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { FileTypes } from "../enums/file-type.enum";
import { ClassEntity } from "../../class/entities/class.entity";
import { JsonMappingType } from "../types/json.type";

@Entity('template_specifications')
export class TemplateSpecificationEntity extends AbstractAuditingEntity {
  @Column({type: 'varchar'})
  name: string;

  @Column({type: 'varchar', name: 'file_type'})
  fileType: FileTypes;

  @Column({type: 'jsonb'})
  template: {
    key: string;
    url: string;
  };

  @Column({type: 'jsonb', name: 'json_mapping'})
  jsonMapping: JsonMappingType;

  @ManyToOne(() => ClassEntity, (classEntity) => classEntity.templateSpecifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;
}