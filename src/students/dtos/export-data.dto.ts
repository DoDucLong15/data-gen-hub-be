import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { transformToArray, transformToJSON } from 'src/base/transformers/dto.transformer';
import { TemplateSpecificationExportListStudent } from 'src/office/constants/template-list-student.const';
import { JsonMappingListType } from 'src/office/types/json-mapping-list.type';
import { ThesisDocumentEnum } from 'src/thesis-management/enums/thesis-document.enum';

export class ExportListStudentRequest {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Transform(transformToArray)
  studentIds: string[];

  @IsOptional()
  @IsObject()
  @Transform(transformToJSON)
  jsonMapping: JsonMappingListType = TemplateSpecificationExportListStudent;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  @IsOptional()
  file: any;
}

export class ExportListStudentRequestV2 {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Transform(transformToArray)
  studentIds: string[];
}

export class ExportStudentFormDataRequest {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Transform(transformToArray)
  studentIds: string[];

  @IsNotEmpty()
  @IsString()
  templateSpecificationId: string;
}

export class ExportStudentFormDataRequestV2 {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Transform(transformToArray)
  studentIds: string[];

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;

  @ValidateIf((o) => o.thesisDocType === ThesisDocumentEnum.ASSIGNMENT_SHEET)
  @IsNotEmpty()
  @IsString()
  thesisStartDate: string;

  @ValidateIf((o) => o.thesisDocType === ThesisDocumentEnum.ASSIGNMENT_SHEET)
  @IsNotEmpty()
  @IsString()
  thesisEndDate: string;

  @ValidateIf((o) => o.thesisDocType === ThesisDocumentEnum.ASSIGNMENT_SHEET)
  @IsNotEmpty()
  @IsDateString()
  teacherSignatureDate: string;
}
