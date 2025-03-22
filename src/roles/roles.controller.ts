import { Body, Param, Controller, Get, Post, UseGuards, Delete, Patch } from '@nestjs/common';
import { RolesService } from './roles.service';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleEnity } from './entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dtos/role.dto';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_Roles })
  async getRoles(): Promise<Partial<RoleEnity>[]> {
    return await this.rolesService
      .getRoles({
        relations: {
          users: true,
        },
      })
      .then((roles) =>
        roles.map((role) => {
          const { users, ...rest } = role;
          return {
            ...rest,
            userCount: users.length,
          };
        }),
      );
  }

  @Post()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Roles })
  async createRole(@Body() request: CreateRoleDto): Promise<RoleEnity> {
    return await this.rolesService.createRole(request);
  }

  @Patch()
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Roles })
  async updateRole(@Body() request: UpdateRoleDto): Promise<RoleEnity> {
    return await this.rolesService.updateRole(request);
  }

  @Delete(':id')
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_Roles })
  async deleteRole(@Param('id') id: string): Promise<boolean> {
    return await this.rolesService.deleteRole(id);
  }
}
