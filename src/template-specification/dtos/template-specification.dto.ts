import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { FileTypes } from '../enums/file-type.enum';
import { JsonMappingSingleType } from '../types/json.type';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { transformToJSON } from 'src/base/transformers/dto.transformer';
import { ActionEnum } from '../enums/action.enum';
import { SpecificationNameEnum } from '../constants/default.const';

export class CreateTemplateSpecificationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(ActionEnum)
  action: ActionEnum;

  @IsNotEmpty()
  @IsString()
  classId: string;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  templateFile: any;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  jsonFile: any;
}

export class UpdateTemplateSpecificationDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  templateFile: any;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  jsonFile: any;
}

export class DownloadDefaultTemplate {
  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(SpecificationNameEnum))
  name: string;

  @IsNotEmpty()
  @IsEnum(ActionEnum)
  action: ActionEnum;

  @ValidateIf((o) => o.action === ActionEnum.EXPORT)
  @IsNotEmpty()
  @IsString()
  @IsIn(['template', 'json'])
  type: 'template' | 'json';
}
