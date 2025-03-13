import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RoleTypes } from '../enums/role-types.enum';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  school: string;

  @IsOptional()
  @IsString()
  department: string;

  @IsOptional()
  @IsString()
  position: string;

  @IsOptional()
  @IsString()
  role: string = RoleTypes.TEACHER;
}

export class UpdateUserDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  school: string;

  @IsOptional()
  @IsString()
  department: string;

  @IsOptional()
  @IsString()
  position: string;

  @IsOptional()
  @IsString()
  role?: string = RoleTypes.TEACHER;
}
