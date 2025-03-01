import { IsEnum, IsNotEmpty, IsObject, IsString } from "class-validator";
import { FileTypes } from "../enums/file-type.enum";
import { JsonMappingType } from "../types/json.type";
import { PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { transformToJSON } from "src/base/transformers/dto.transformer";

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
  jsonMapping: JsonMappingType;

  @IsNotEmpty()
  @IsString()
  classId: string;
}

export class UpdateTemplateSpecificationDto extends PartialType(CreateTemplateSpecificationDto) {
  @IsNotEmpty()
  @IsString()
  id: string;
}