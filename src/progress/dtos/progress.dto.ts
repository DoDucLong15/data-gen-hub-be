import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { transformToArray } from 'src/base/transformers/dto.transformer';
import { EProgressStatus, EProgressType } from '../constant/progress.const';
import { ActionEnum } from 'src/template-specification/enums/action.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GetProgressDto {
  @IsOptional()
  @IsArray()
  @Transform(transformToArray)
  @IsEnum(EProgressType, { each: true })
  @ApiProperty({ enum: EProgressType, isArray: true, required: false })
  types: EProgressType[];

  @IsOptional()
  @IsArray()
  @Transform(transformToArray)
  @IsEnum(EProgressStatus, { each: true })
  @ApiProperty({ enum: EProgressStatus, isArray: true, required: false })
  statuses: EProgressStatus[];

  @IsOptional()
  @IsArray()
  @Transform(transformToArray)
  @IsString({ each: true })
  @ApiProperty({ required: false, isArray: true })
  processIds: string[];

  @IsOptional()
  @IsArray()
  @Transform(transformToArray)
  @IsEnum(ActionEnum, { each: true })
  @ApiProperty({ enum: ActionEnum, isArray: true, required: false })
  actions: ActionEnum[];

  @IsOptional()
  @IsArray()
  @Transform(transformToArray)
  @IsString({ each: true })
  @ApiProperty({ required: false, isArray: true })
  classIds: string[];
}
