import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ThesisDocumentEnum } from 'src/thesis-management/enums/thesis-document.enum';

export class ImportListStudentRequest {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, required: true })
  files: any[];
}

export class ImportStudentFormDataRequest {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  type: ThesisDocumentEnum;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, required: true })
  files: any[];
}

export class ImportStudentFormDataRequestV2 {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsNotEmpty()
  @IsEnum(ThesisDocumentEnum)
  thesisDocType: ThesisDocumentEnum;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, required: true })
  files: any[];
}
