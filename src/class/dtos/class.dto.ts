import { PartialType } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { transformToArray } from 'src/base/transformers/dto.transformer';
import { ESyncDriveDataType } from '../enums/sync-data.type';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  classCode: string;

  @IsNotEmpty()
  @IsString()
  courseCode: string;

  @IsNotEmpty()
  @IsString()
  semester: string;

  @IsOptional()
  @IsArray()
  studentPaths: string[];

  @IsOptional()
  @IsString()
  driveId: string;

  @IsOptional()
  @IsString()
  onedriveSharedLink: string;
}

export class UpdateClassDto extends PartialType(CreateClassDto) {
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class ClassDriveItemDto {
  @IsOptional()
  @IsString()
  driveId: string;

  @IsOptional()
  @IsString()
  folderInputId: string;

  @IsOptional()
  @IsString()
  folderOutputId: string;
}

export class SaveClassDriveInfoDto {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsOptional()
  @IsString()
  driveId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClassDriveItemDto)
  studentList: ClassDriveItemDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClassDriveItemDto)
  assignmentSheets: ClassDriveItemDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClassDriveItemDto)
  guidanceReviews: ClassDriveItemDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClassDriveItemDto)
  supervisoryComments: ClassDriveItemDto;
}

export class DownloadFileFromDriveDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @Transform(transformToArray)
  fileIds: string[];
}

export class SyncClassDriveDataRequest {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(ESyncDriveDataType, { each: true })
  types: ESyncDriveDataType[];
}
