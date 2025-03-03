import { PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  mssv: string;

  @IsOptional()
  @IsPhoneNumber('VN')
  phone: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  middleName: string;

  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  projectTitle: string;

  @IsOptional()
  @IsString()
  supervisor: string;

  @IsOptional()
  @IsString()
  reviewer: string;

  @IsOptional()
  @IsString()
  studentClassName: string;

  @IsNotEmpty()
  @IsString()
  classId: string;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @IsNotEmpty()
  @IsString()
  id: string;
}
