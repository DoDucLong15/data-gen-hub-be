import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { DriveApisService } from './drive-apis.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { ListDriveItemsDto } from './dtos/drive.dto';
import { DriveItem } from './types/drive-config.type';

@ApiTags('Drive Apis')
@ApiBearerAuth()
@Controller('drive-apis')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class DriveApisController {
  constructor(private readonly driveApisService: DriveApisService) {}

  @Get('files')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_Configuration })
  async listFiles(@Query() query: ListDriveItemsDto): Promise<DriveItem[]> {
    return await this.driveApisService.listFiles(query);
  }

  @Post('health-check')
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_Configuration })
  async healthCheck() {
    return await this.driveApisService.healthCheck();
  }
}
