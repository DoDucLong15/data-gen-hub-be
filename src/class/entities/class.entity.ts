import { UserEntity } from '../../users/entities/user.entity';
import { AbstractAuditingEntity } from '../../base/entities/abstract-auditing-entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { TemplateSpecificationEntity } from '../../template-specification/entities/template-specification.entity';
import { StudentEntity } from '../../students/entities/student.entity';

@Entity('classes')
export class ClassEntity extends AbstractAuditingEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', name: 'class_code' })
  classCode: string;

  @Column({ type: 'varchar', name: 'course_code' })
  courseCode: string;

  @Column({ type: 'varchar' })
  semester: string;

  @ManyToOne(() => UserEntity, (user) => user.classes, {
    onDelete: 'CASCADE',
  })
  teacher: UserEntity;

  @OneToMany(
    () => TemplateSpecificationEntity,
    (templateSpecification) => templateSpecification.class,
    {
      cascade: true,
    },
  )
  templateSpecifications: TemplateSpecificationEntity[];

  @OneToMany(() => StudentEntity, (student) => student.class, {
    cascade: true,
  })
  students: StudentEntity[];
}
