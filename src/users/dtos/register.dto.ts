import { IsString } from 'class-validator';

import { IsNotEmpty } from 'class-validator';

export class ApproveRegisterDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  roleId: string;
}
