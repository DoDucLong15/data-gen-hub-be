import { IsNotEmpty, IsString } from "class-validator";

export class ImportListStudentRequest {
  @IsNotEmpty()
  @IsString()
  classId: string;
}