import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { FileTypes } from '../enums/file-type.enum';
import { JsonMappingSingleType } from '../types/json.type';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { transformToJSON } from 'src/base/transformers/dto.transformer';

export class CreateTemplateSpecificationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(FileTypes)
  fileType: FileTypes;

  @IsNotEmpty()
  @IsObject()
  @Transform(transformToJSON)
  jsonMapping: JsonMappingSingleType;

  @IsNotEmpty()
  @IsString()
  classId: string;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  @IsOptional()
  file: any;
}

export class UpdateTemplateSpecificationDto extends PartialType(CreateTemplateSpecificationDto) {
  @IsNotEmpty()
  @IsString()
  id: string;
}
