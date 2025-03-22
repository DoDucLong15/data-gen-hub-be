import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { CreatePermissionDto, UpdatePermissionDto } from './dtos/permission.dto';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleTypes } from 'src/users/enums/role-types.enum';
import { PermissionEntity } from './entities/permission.entity';
import { BaseResponse } from 'src/base/types/response.type';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(AccessTokenGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles(RoleTypes.ADMIN)
  async createPermission(@Body() dto: CreatePermissionDto): Promise<PermissionEntity> {
    return this.permissionsService.createPermission(dto);
  }

  @Patch()
  @Roles(RoleTypes.ADMIN)
  async updatePermission(@Body() dto: UpdatePermissionDto): Promise<PermissionEntity> {
    return this.permissionsService.updatePermission(dto);
  }

  @Delete(':id')
  @Roles(RoleTypes.ADMIN)
  async deletePermission(@Param('id') id: string): Promise<BaseResponse> {
    return this.permissionsService.deletePermission(id);
  }

  @Get()
  @Roles(RoleTypes.ADMIN)
  async getPermissions(): Promise<PermissionEntity[]> {
    return this.permissionsService.getPermissions();
  }
}
