import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { transformToArray, transformToJSON } from 'src/base/transformers/dto.transformer';

export enum ImportExportDynamicType {
  LIST = 'list',
  SINGLE = 'single',
}

export class ImportExportDynamicDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, required: true })
  inputFiles: any[];

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  specificationInput: any;

  @IsNotEmpty()
  @IsEnum(ImportExportDynamicType)
  importType: ImportExportDynamicType;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  templateFile: any;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  specificationOutput: any;

  @IsNotEmpty()
  @IsEnum(ImportExportDynamicType)
  exportType: ImportExportDynamicType;

  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @Transform(transformToArray)
  shareEmails: string[];

  @IsNotEmpty()
  @IsString()
  classId: string;
}
