import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { GetProgressDto } from './dtos/progress.dto';
import { CommonUtils } from 'src/utils/common.util';
import { In } from 'typeorm';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { EAction } from 'src/permissions/enums/action.enum';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { ESubject } from 'src/authorization/enums/subject.enum';

@ApiTags('Progress')
@ApiBearerAuth()
@Controller('progress')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  @CheckPolicies({ action: EAction.READ, subject: ESubject.Progress })
  async getNotificationProgress(@Query() query: GetProgressDto, @User() user: UserPayload) {
    let whereCondition: any = {
      ...(CommonUtils.isNotEmptyArray(query.types) && { type: In(query.types) }),
      ...(CommonUtils.isNotEmptyArray(query.statuses) && { status: In(query.statuses) }),
      ...(CommonUtils.isNotEmptyArray(query.processIds) && { processId: In(query.processIds) }),
      ...(CommonUtils.isNotEmptyArray(query.actions) && { action: In(query.actions) }),
      createBy: In([user.email, 'system']),
    };

    if (CommonUtils.isNotEmptyArray(query.classIds)) {
      whereCondition = [
        {
          ...whereCondition,
          classId: In(query.classIds),
        },
        ...query.classIds.map((classId) => ({
          ...whereCondition,
          config: {
            [classId]: true,
          },
        })),
      ];
    }

    return await this.progressService.getMany({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });
  }
}
