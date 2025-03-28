import { Controller, Get, UseGuards } from '@nestjs/common';
import { CronManagementService } from './cron-management.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';

@ApiTags('Cron Management')
@ApiBearerAuth()
@Controller('cron-management')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class CronManagementController {
  constructor(private readonly cronManagementService: CronManagementService) {}

  @Get('jobs')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_CronManagement })
  getCronJobs() {
    return this.cronManagementService.getCronJobs();
  }
}
