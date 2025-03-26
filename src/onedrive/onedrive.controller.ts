import { Controller, Get, UseGuards } from '@nestjs/common';
import { OnedriveService } from './onedrive.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';

@ApiTags('Onedrive')
@ApiBearerAuth()
@Controller('onedrive')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class OnedriveController {
  constructor(private readonly onedriveService: OnedriveService) {}

  @Get('me')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async getMe() {
    return await this.onedriveService.getMe();
  }

  @Get('items')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Onedrive })
  async listItemsInMyDrive() {
    return await this.onedriveService.listItemsInMyDrive();
  }
}
