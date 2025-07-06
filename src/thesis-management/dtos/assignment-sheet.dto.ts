import { PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsSemVer,
  IsString,
} from 'class-validator';
import { ThesisDocumentEnum } from '../enums/thesis-document.enum';
import { Transform } from 'class-transformer';
import { transformToArray } from 'src/base/transformers/dto.transformer';

export class CreateAssignmentSheetDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  mssv: string;

  @IsOptional()
  @IsString()
  studentClassName: string;

  @IsOptional()
  @IsString()
  projectTitle: string;

  @IsOptional()
  @IsString()
  supervisor: string;

  @IsOptional()
  @IsPhoneNumber('VN')
  phone: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  classCode: string;

  @IsOptional()
  @IsString()
  semester: string;

  @IsOptional()
  @IsString()
  school: string;

  @IsOptional()
  @IsString()
  thesisStartDate: string;

  @IsOptional()
  @IsString()
  thesisEndDate: string;

  @IsOptional()
  @IsString()
  studentKnowledgeGained: string;

  @IsOptional()
  @IsString()
  technologyGained: string;

  @IsOptional()
  @IsString()
  acquiredSkills: string;

  @IsOptional()
  @IsString()
  expectedProducts: string;

  @IsOptional()
  @IsString()
  realWorldProblemSolved: string;

  @IsOptional()
  @IsString()
  student_sign_date: string;

  @IsOptional()
  @IsString()
  supervisor_sign_date: string;

  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;

  @IsOptional()
  @IsString()
  fieldOfExpertise: string;
}

export class UpdateAssignmentSheetDto extends PartialType(CreateAssignmentSheetDto) {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;
}

export class GetListAssignmentSheetDto {
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

export class GetOneAssignmentSheetDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;
}

export class DeleteAssignmentSheetDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;
}

export class DownloadFileAssignmentSheetDto {
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

export class DeleteFileAssignmentSheetDto {
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
