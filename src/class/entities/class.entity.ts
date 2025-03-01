import { UserEntity } from "../../users/entities/user.entity";
import { AbstractAuditingEntity } from "../../base/entities/abstract-auditing-entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity('classes')
export class ClassEntity extends AbstractAuditingEntity {
  @Column({type: 'varchar'})
  name: string;

  @Column({type: 'varchar', name: 'class_code'})
  classCode: string;

  @Column({type: 'varchar', name: 'course_code'})
  courseCode: string;

  @Column({type: 'varchar'})
  semester: string;

  @ManyToOne(() => UserEntity, (user) => user.classes, {
    onDelete: 'CASCADE',
  })
  teacher: UserEntity;
}