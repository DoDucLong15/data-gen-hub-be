import { UserEntity } from '../../users/entities/user.entity';
import { AbstractAuditingEntity } from '../../base/entities/abstract-auditing-entity';
import { Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { TemplateSpecificationEntity } from '../../template-specification/entities/template-specification.entity';
import { StudentEntity } from '../../students/entities/student.entity';
import { AssignmentSheetsEntity } from '../../thesis-management/entities/assignment-sheet.entity';
import { GuidanceReviewEntity } from '../../thesis-management/entities/guidance-review.entity';
import { SupervisoryCommentsEntity } from '../../thesis-management/entities/supervisory-comments.entity';
import { ClassDriveInfoEntity } from './drive-info.entity';
import { ClassOnedriveInfoEntity } from './onedrive-info.entity';

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

  @Column({ type: 'varchar', array: true, name: 'student_paths', nullable: true })
  studentPaths: string[];

  @Column({ type: 'varchar', name: 'output_path', nullable: true })
  outputPath: string;

  @OneToMany(() => AssignmentSheetsEntity, (assignmentSheet) => assignmentSheet.class, {
    cascade: true,
  })
  assignmentSheets: AssignmentSheetsEntity[];

  @OneToMany(() => GuidanceReviewEntity, (guidanceReview) => guidanceReview.class, {
    cascade: true,
  })
  guidanceReviews: GuidanceReviewEntity[];

  @OneToMany(() => SupervisoryCommentsEntity, (supervisoryComment) => supervisoryComment.class, {
    cascade: true,
  })
  supervisoryComments: SupervisoryCommentsEntity[];

  @OneToOne(() => ClassDriveInfoEntity, (driveInfo) => driveInfo.class, {
    cascade: true,
  })
  driveInfo: ClassDriveInfoEntity;

  @OneToOne(() => ClassOnedriveInfoEntity, (onedriveInfo) => onedriveInfo.class, {
    cascade: true,
  })
  onedriveInfo: ClassOnedriveInfoEntity;

  @Column({ type: 'varchar', name: 'drive_id', nullable: true })
  driveId: string | null;

  @Column({ type: 'varchar', name: 'onedrive_shared_link', nullable: true })
  onedriveSharedLink: string | null;
}
