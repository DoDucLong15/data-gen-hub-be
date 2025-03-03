import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ImportListStudentRequest {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, required: true })
  files: any[];
}