import { AbstractAuditingEntity } from 'src/base/entities/abstract-auditing-entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { TClassDriveItem } from '../types/class-drive.type';
import { ClassEntity } from './class.entity';

@Entity('class_drive_infos')
export class ClassDriveInfoEntity extends AbstractAuditingEntity {
  @Column({ type: 'varchar', name: 'drive_id' })
  driveId: string;

  @Column({ type: 'jsonb', name: 'student_list', nullable: true })
  studentList: TClassDriveItem;

  @Column({ type: 'jsonb', name: 'assignment_sheets', nullable: true })
  assignmentSheets: TClassDriveItem;

  @Column({ type: 'jsonb', name: 'guidance_reviews', nullable: true })
  guidanceReviews: TClassDriveItem;

  @Column({ type: 'jsonb', name: 'supervisory_comments', nullable: true })
  supervisoryComments: TClassDriveItem;

  @OneToOne(() => ClassEntity, (classEntity) => classEntity.driveInfo, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'class_id',
    referencedColumnName: 'id',
  })
  class: ClassEntity;

  // FOREIGN KEY
  @Column({ type: 'varchar', name: 'class_id' })
  classId: string;
}
