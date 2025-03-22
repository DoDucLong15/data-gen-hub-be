import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SystemConfigurationService } from './system-configuration.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleTypes } from 'src/users/enums/role-types.enum';
import {
  CreateSystemConfigDto,
  GetSystemConfigQueryDto,
  UpdateSystemConfigDto,
} from './dtos/system-config.dto';
import { SystemConfigEntity } from './entities/system-config.entity';
import { BaseResponse } from 'src/base/types/response.type';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';

@ApiTags('System Configuration')
@ApiBearerAuth()
@Controller('system-configuration')
@UseGuards(AccessTokenGuard, PoliciesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class SystemConfigurationController {
  constructor(private readonly systemConfigurationService: SystemConfigurationService) {}

  @Get()
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_Configuration })
  getSystemConfigurations(@Query() query: GetSystemConfigQueryDto): Promise<SystemConfigEntity[]> {
    return this.systemConfigurationService.list(query);
  }

  @Post()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Configuration })
  createSystemConfiguration(@Body() dto: CreateSystemConfigDto): Promise<SystemConfigEntity> {
    return this.systemConfigurationService.create(dto);
  }

  @Put()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Configuration })
  updateSystemConfiguration(@Body() dto: UpdateSystemConfigDto): Promise<SystemConfigEntity> {
    return this.systemConfigurationService.update(dto);
  }

  @Delete(':key')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Configuration })
  async deleteSystemConfiguration(@Param('key') key: string): Promise<BaseResponse> {
    await this.systemConfigurationService.delete(key);
    return {
      status: 'success',
      message: 'System configuration deleted successfully',
    };
  }
}
