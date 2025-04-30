import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { transformToArray, transformToBoolean } from 'src/base/transformers/dto.transformer';

export class ListDriveItemsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(transformToArray)
  driveIds: string[] = [];

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(-1)
  deps: number = 0;
}

export class UploadFilesDto {
  @IsNotEmpty()
  @IsString()
  folderId: string;

  @IsOptional()
  @IsString()
  driveId: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, required: true })
  files: any[];
}

export class CreateFolderDto {
  @IsNotEmpty()
  @IsString()
  folderName: string;

  @IsNotEmpty()
  @IsString()
  parentFolderId: string;
}

export class CheckFileExistsInParentDto {
  @IsNotEmpty()
  @IsString()
  fileIdentifier: string;

  @IsNotEmpty()
  @IsString()
  parentFolderId: string;

  @IsOptional()
  @IsBoolean()
  @Transform(transformToBoolean)
  isFileName: boolean;
}
