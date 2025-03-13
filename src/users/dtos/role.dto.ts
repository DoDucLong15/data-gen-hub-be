import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsNotEmpty()
  @IsString()
  id: string;
}
