import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleTypes } from 'src/users/enums/role-types.enum';
import { GetProgressDto } from './dtos/progress.dto';
import { CommonUtils } from 'src/utils/common.util';
import { In } from 'typeorm';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';

@ApiTags('Progress')
@ApiBearerAuth()
@Controller('progress')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(RoleTypes.ADMIN, RoleTypes.TEACHER)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  async getNotificationProgress(@Query() query: GetProgressDto, @User() user: UserPayload) {
    return await this.progressService.getMany({
      where: {
        ...(CommonUtils.isNotEmptyArray(query.types) && { type: In(query.types) }),
        ...(CommonUtils.isNotEmptyArray(query.statuses) && { status: In(query.statuses) }),
        ...(CommonUtils.isNotEmptyArray(query.processIds) && { processId: In(query.processIds) }),
        ...(CommonUtils.isNotEmptyArray(query.classIds) && { classId: In(query.classIds) }),
        ...(CommonUtils.isNotEmptyArray(query.actions) && { action: In(query.actions) }),
        createBy: user.email,
      },
      order: { createdAt: 'DESC' },
    });
  }
}
