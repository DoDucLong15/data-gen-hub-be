import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { transformToArray } from 'src/base/transformers/dto.transformer';

export class ListDriveItemsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(transformToArray)
  driveIds: string[] = [];

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(-1)
  deps: number = 0;
}
