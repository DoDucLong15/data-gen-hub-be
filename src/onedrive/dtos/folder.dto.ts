import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFolderInSpecificDriveDto {
  @IsString()
  @IsNotEmpty()
  driveId: string;

  @IsString()
  @IsNotEmpty()
  parentFolderId: string;

  @IsString()
  @IsNotEmpty()
  folderName: string;
}
