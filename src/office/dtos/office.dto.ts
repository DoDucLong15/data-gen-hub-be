import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsObject } from 'class-validator';
import { transformToArray, transformToJSON } from 'src/base/transformers/dto.transformer';

export enum ImportExportDynamicType {
  LIST = 'list',
  SINGLE = 'single',
}

export class ImportExportDynamicDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, required: true })
  inputFiles: any[];

  @IsNotEmpty()
  @IsObject()
  @Transform(transformToJSON)
  specificationInput: any;

  @IsNotEmpty()
  @IsEnum(ImportExportDynamicType)
  importType: ImportExportDynamicType;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  templateFile: any;

  @IsNotEmpty()
  @IsObject()
  @Transform(transformToJSON)
  specificationOutput: any;

  @IsNotEmpty()
  @IsEnum(ImportExportDynamicType)
  exportType: ImportExportDynamicType;
}
