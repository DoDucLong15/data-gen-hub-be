import { PartialType } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { EAction } from '../enums/action.enum';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsEnum(EAction)
  action: EAction;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  fields?: string[];

  @IsOptional()
  conditions?: any;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @IsString()
  @IsNotEmpty()
  id: string;
}
