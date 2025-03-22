import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  permissionIds: string[];
}

export class BindPermissionDto {
  @IsNotEmpty()
  @IsString()
  permissionId: string;

  @IsNotEmpty()
  @IsString()
  action: string;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsNotEmpty()
  @IsString()
  id: string;
}
