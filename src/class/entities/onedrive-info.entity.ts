import { AbstractAuditingEntity } from 'src/base/entities/abstract-auditing-entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { TClassOneDriveItem } from '../types/class-drive.type';
import { ClassEntity } from './class.entity';

@Entity('class_onedrive_infos')
export class ClassOnedriveInfoEntity extends AbstractAuditingEntity {
  @Column({ type: 'varchar', name: 'onedrive_shared_link' })
  onedriveSharedLink: string;

  @Column({ type: 'varchar', name: 'drive_id' })
  driveId: string;

  @Column({ type: 'varchar', name: 'item_id' })
  itemId: string;

  @Column({ type: 'jsonb', name: 'student_list', nullable: true })
  studentList: TClassOneDriveItem;

  @Column({ type: 'jsonb', name: 'assignment_sheets', nullable: true })
  assignmentSheets: TClassOneDriveItem;

  @Column({ type: 'jsonb', name: 'guidance_reviews', nullable: true })
  guidanceReviews: TClassOneDriveItem;

  @Column({ type: 'jsonb', name: 'supervisory_comments', nullable: true })
  supervisoryComments: TClassOneDriveItem;

  @OneToOne(() => ClassEntity, (classEntity) => classEntity.onedriveInfo, {
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

  @Column({ type: 'varchar', name: 'last_sync', nullable: true })
  lastSync: string;
}
