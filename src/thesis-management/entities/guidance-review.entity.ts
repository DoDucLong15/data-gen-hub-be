import { ClassEntity } from '../../class/entities/class.entity';
import { AbstractAuditingEntity } from '../../base/entities/abstract-auditing-entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('guidance_reviews')
export class GuidanceReviewEntity extends AbstractAuditingEntity {
  @Column({ type: 'varchar', name: 'supervisor', nullable: true })
  supervisor: string;

  @Column({ type: 'varchar', name: 'full_name', nullable: false })
  fullName: string;

  @Column({ type: 'varchar', name: 'mssv', nullable: false })
  mssv: string;

  @Column({ type: 'varchar', name: 'project_title', nullable: true })
  projectTitle: string;

  @Column({ type: 'varchar', name: 'input_path', nullable: true })
  inputPath: string;

  @Column({ type: 'varchar', name: 'output_path', nullable: true })
  outputPath: string;

  @Column({ type: 'varchar', name: 'type_of_thesis', nullable: true })
  typeOfThesis: string;

  @Column({ type: 'float', name: 'topic_uniqueness_point', nullable: true })
  topicUniquenessPoint: number; // Tính độc đáo và/hoặc tính thời sự của đề tài

  @Column({ type: 'float', name: 'workload_point', nullable: true })
  workloadPoint: number; //Quy mô, khối lượng công việc đã thực hiện

  @Column({ type: 'float', name: 'problem_difficulty_point', nullable: true })
  problemDifficultyPoint: number; // Độ khó, độ phức tạp của vấn đề

  @Column({ type: 'float', name: 'solution_impact_point', nullable: true })
  solutionImpactPoint: number; //Khả năng ứng dụng và/hoặc giá trị khoa học của giải pháp đề xuất

  @Column({ type: 'float', name: 'product_finalization_point', nullable: true })
  productFinalizationPoint: number; // Độ hoàn thiện của sản phẩm

  @Column({ type: 'float', name: 'layout_coherence_point', nullable: true })
  layoutCoherencePoint: number; // Tính hợp lý của bố cục

  @Column({ type: 'float', name: 'content_validity_point', nullable: true })
  contentValidityPoint: number; // Tính đầy đủ và đúng đắn về các nội dung cần trình bày

  @Column({ type: 'float', name: 'presentation_quality_point', nullable: true })
  presentationQualityPoint: number; // Văn phong và hình thức trình bày (chính tả, hình vẽ, bảng biểu, thuật ngữ...)

  @Column({ type: 'float', name: 'literature_review_point', nullable: true })
  reliabilityAndReferencesPoint: number; // "Mức độ tin cậy về nội dung (có đầy đủ tài liệu tham khảo và tham chiếu tới tài liệu)"

  @Column({ type: 'float', name: 'response_accuracy_point', nullable: true })
  responseAccuracyPoint: number; // Tính hợp lý, đúng đắn và đầy đủ khi trả lời câu hỏi trong phiên phản biện

  @Column({ type: 'float', name: 'presentation_skills_point', nullable: true })
  presentationSkillsPoint: number; // Kỹ năng trình bày, demo sản phẩm làm nổi bật được kết quả

  @Column({ type: 'float', name: 'reward_point', nullable: true })
  rewardPoint: number; // Điểm thưởng

  @Column({ type: 'text', name: 'general_feedback', nullable: true })
  generalFeedback: string; // Nhận xét tổng quát

  @Column({ type: 'text', name: 'conclusion', nullable: true })
  conclusion: string; // Kết luận

  @Column({ type: 'varchar', name: 'teacher_sign_date', nullable: true })
  teacherSignDate: string;

  @ManyToOne(() => ClassEntity, (classEntity) => classEntity.guidanceReviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;
}
