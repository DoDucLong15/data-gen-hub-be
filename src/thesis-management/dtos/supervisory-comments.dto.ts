import { PartialType } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ThesisDocumentEnum } from '../enums/thesis-document.enum';
import { Transform } from 'class-transformer';
import { transformToArray } from 'src/base/transformers/dto.transformer';

export class CreateSupervisoryCommentsDto {
  @IsOptional()
  @IsString()
  supervisor: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  mssv: string;

  @IsOptional()
  @IsString()
  projectTitle: string;

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
