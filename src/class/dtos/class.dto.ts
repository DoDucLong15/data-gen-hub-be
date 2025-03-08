import { PartialType } from '@nestjs/swagger';
import { IsArray, isNotEmpty, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  classCode: string;

  @IsNotEmpty()
  @IsString()
  courseCode: string;

  @IsNotEmpty()
  @IsString()
  semester: string;

  @IsOptional()
  @IsArray()
  studentPaths: string[];
}

export class UpdateClassDto extends PartialType(CreateClassDto) {
  @IsNotEmpty()
  @IsString()
  id: string;
}
