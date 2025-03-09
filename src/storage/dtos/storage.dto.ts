import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class DownloadFilesDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  paths: string[];
}
