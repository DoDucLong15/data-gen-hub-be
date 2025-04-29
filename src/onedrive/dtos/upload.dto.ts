import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadFileToDriveIdDto {
  @IsNotEmpty()
  @IsString()
  driveId: string;

  @IsNotEmpty()
  @IsString()
  parentFolderId: string;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file: any;
}

export class UploadFileToMyDriveDto {
  @IsNotEmpty()
  @IsString()
  parentFolderId: string;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file: any;
}
