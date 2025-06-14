import { PartialType } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ThesisDocumentEnum } from '../enums/thesis-document.enum';
import { Transform } from 'class-transformer';
import { transformToArray } from 'src/base/transformers/dto.transformer';

export class CreateSupervisoryCommentsDto {
  @IsOptional()
  @IsString()
  reviewer: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  mssv: string;

  @IsOptional()
  @IsString()
  projectTitle: string;

  @IsOptional()
  @IsString()
  typeOfThesis: string;

  @IsOptional()
  @IsNumber()
  topicUniquenessPoint: number; // Tính độc đáo và/hoặc tính thời sự của đề tài

  @IsOptional()
  @IsNumber()
  workloadPoint: number; //Quy mô, khối lượng công việc đã thực hiện

  @IsOptional()
  @IsNumber()
  problemDifficultyPoint: number; // Độ khó, độ phức tạp của vấn đề

  @IsOptional()
  @IsNumber()
  solutionImpactPoint: number; //Khả năng ứng dụng và/hoặc giá trị khoa học của giải pháp đề xuất

  @IsOptional()
  @IsNumber()
  productFinalizationPoint: number; // Độ hoàn thiện của sản phẩm

  @IsOptional()
  @IsNumber()
  layoutCoherencePoint: number; // Tính hợp lý của bố cục

  @IsOptional()
  @IsNumber()
  contentValidityPoint: number; // Tính đầy đủ và đúng đắn về các nội dung cần trình bày

  @IsOptional()
  @IsNumber()
  presentationQualityPoint: number; // Văn phong và hình thức trình bày (chính tả, hình vẽ, bảng biểu, thuật ngữ...)

  @IsOptional()
  @IsNumber()
  reliabilityAndReferencesPoint: number; // "Mức độ tin cậy về nội dung (có đầy đủ tài liệu tham khảo và tham chiếu tới tài liệu)"

  @IsOptional()
  @IsNumber()
  responseAccuracyPoint: number; // Tính hợp lý, đúng đắn và đầy đủ khi trả lời câu hỏi trong phiên phản biện

  @IsOptional()
  @IsNumber()
  presentationSkillsPoint: number; // Kỹ năng trình bày, demo sản phẩm làm nổi bật được kết quả

  @IsOptional()
  @IsNumber()
  rewardPoint: number; // Điểm thưởng

  @IsOptional()
  @IsString()
  generalFeedback: string; // Nhận xét tổng quát

  @IsOptional()
  @IsString()
  conclusion: string; // Kết luận

  @IsOptional()
  @IsString()
  teacherSignDate: string;

  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;
}

export class UpdateSupervisoryCommentsDto extends PartialType(CreateSupervisoryCommentsDto) {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;
}

export class GetListSupervisoryCommentsDto {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToArray)
  ids: string[];

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;
}

export class GetOneSupervisoryCommentsDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;
}

export class DeleteSupervisoryCommentsDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;
}

export class DownloadFileSupervisoryCommentsDto {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToArray)
  ids: string[];

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;
}

export class DeleteFileSupervisoryCommentsDto {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToArray)
  ids: string[];

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;
}
