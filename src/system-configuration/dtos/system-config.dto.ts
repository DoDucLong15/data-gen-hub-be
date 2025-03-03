import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { transformToArray } from 'src/base/transformers/dto.transformer';

@ValidatorConstraint({ name: 'require_value', async: false })
export class RequireValue implements ValidatorConstraintInterface {
  validate(_value: string, args: ValidationArguments): boolean {
    const dto = args.object as CreateSystemConfigDto;
    if (_value && Object.keys(dto).length !== 2) {
      return false;
    }
    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return `Require value one of "stringValue", "numberValue", "booleanValue", "jsonValue"`;
  }
}

@ValidatorConstraint({ name: 'isArrayOrJsonObject', async: false })
export class IsArrayOrJsonObject implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
        return true;
      } catch (e) {
        return false;
      }
    }

    const isArray = Array.isArray(value);
    const isObject = value !== null && typeof value === 'object' && !isArray;

    return isArray || isObject;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'jsonValue must be an array or a valid JSON object';
  }
}

export class CreateSystemConfigDto {
  @IsNotEmpty()
  @IsString()
  @Validate(RequireValue)
  key: string;

  @IsOptional()
  @IsString()
  stringValue?: string;

  @IsOptional()
  @IsNumber()
  numberValue?: number;

  @IsOptional()
  @IsBoolean()
  booleanValue?: boolean;

  @IsOptional()
  @Validate(IsArrayOrJsonObject)
  jsonValue?: Record<string, any>;
}

export class GetSystemConfigQueryDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(transformToArray)
  keys?: string[];
}

export class UpdateSystemConfigDto extends CreateSystemConfigDto {}
