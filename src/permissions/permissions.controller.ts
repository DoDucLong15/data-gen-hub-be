import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { CreatePermissionDto, UpdatePermissionDto } from './dtos/permission.dto';
import { PermissionEntity } from './entities/permission.entity';
import { BaseResponse } from 'src/base/types/response.type';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { EAction } from './enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Permissions })
  async createPermission(@Body() dto: CreatePermissionDto): Promise<PermissionEntity> {
    return this.permissionsService.createPermission(dto);
  }

  @Patch()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Permissions })
  async updatePermission(@Body() dto: UpdatePermissionDto): Promise<PermissionEntity> {
    return this.permissionsService.updatePermission(dto);
  }

  @Delete(':id')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Permissions })
  async deletePermission(@Param('id') id: string): Promise<BaseResponse> {
    return this.permissionsService.deletePermission(id);
  }

  @Get()
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_Permissions })
  async getPermissions(): Promise<PermissionEntity[]> {
    return this.permissionsService.getPermissions();
  }
}
