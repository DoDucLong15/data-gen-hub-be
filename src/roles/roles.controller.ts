import { Body, Param, Controller, Get, Post, UseGuards, Delete, Patch } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RoleTypes } from 'src/users/enums/role-types.enum';
import { Roles } from 'src/auth/decorators/role.decorator';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleEnity } from './entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dtos/role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(AccessTokenGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(RoleTypes.ADMIN)
  async getRoles(): Promise<RoleEnity[]> {
    return await this.rolesService
      .getRoles({
        relations: {
          users: true,
          permissions: true,
        },
      })
      .then((roles) =>
        roles.map((role) => ({
          ...role,
          userCount: role.users.length,
        })),
      );
  }

  @Post()
  @Roles(RoleTypes.ADMIN)
  async createRole(@Body() request: CreateRoleDto): Promise<RoleEnity> {
    return await this.rolesService.createRole(request);
  }

  @Patch()
  @Roles(RoleTypes.ADMIN)
  async updateRole(@Body() request: UpdateRoleDto): Promise<RoleEnity> {
    return await this.rolesService.updateRole(request);
  }

  @Delete(':id')
  @Roles(RoleTypes.ADMIN)
  async deleteRole(@Param('id') id: string): Promise<boolean> {
    return await this.rolesService.deleteRole(id);
  }
}
