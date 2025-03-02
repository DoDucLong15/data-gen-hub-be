import { Transform } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import { transformToArray, transformToJSON } from "src/base/transformers/dto.transformer";
import { TemplateSpecificationExportListStudent } from "src/office/constants/template-list-student.const";
import { JsonMappingListType } from "src/office/types/json-mapping-list.type";

export class ExportListStudentRequest {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Transform(transformToArray)
  studentIds: string[];

  @IsOptional()
  @IsObject()
  @Transform(transformToJSON)
  jsonMapping: JsonMappingListType = TemplateSpecificationExportListStudent;
}