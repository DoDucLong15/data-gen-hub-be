import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from './dtos/user.dto';
import { UserResponse } from './types/user-response.type';
import { MapperUserResponse } from './helpers/mapper.helper';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { User } from 'src/auth/decorators/user.decorator';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleTypes } from './enums/role-types.enum';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { RoleService } from './sub-services/role.service';
import { RoleEnity } from './entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dtos/role.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AccessTokenGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly roleService: RoleService,
  ) {}

  @Post()
  @Roles(RoleTypes.ADMIN)
  async createUser(@Body() request: CreateUserDto): Promise<UserResponse> {
    return await this.usersService.createUser(request);
  }

  @Patch()
  async updateUser(
    @Body() request: UpdateUserDto,
    @User() user: UserPayload,
  ): Promise<UserResponse> {
    return await this.usersService.updateUserInfo(request, user);
  }

  @Get('me')
  async getUserInfo(@User() user: UserPayload): Promise<UserResponse> {
    return await this.usersService.getUserInfo(user.email);
  }

  @Get('/one/:id')
  @Roles(RoleTypes.ADMIN)
  async getUserById(@Param('id') id: string): Promise<UserResponse | null> {
    return await this.usersService
      .getUserById(id)
      .then((data) => (data ? MapperUserResponse(data) : null));
  }

  @Get()
  @Roles(RoleTypes.ADMIN)
  async getAllUsers(): Promise<UserResponse[]> {
    return await this.usersService
      .getUsers({
        order: { createdAt: 'DESC' },
      })
      .then((users) => users.map(MapperUserResponse));
  }

  @Delete(':id')
  @Roles(RoleTypes.ADMIN)
  async deleteUser(@Param('id') id: string): Promise<boolean> {
    return await this.usersService.deleteUser(id);
  }

  @Get('role')
  @Roles(RoleTypes.ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  async getRoles(): Promise<RoleEnity[]> {
    return await this.roleService.getRoles();
  }

  @Post('role')
  @Roles(RoleTypes.ADMIN)
  async createRole(@Body() request: CreateRoleDto): Promise<RoleEnity> {
    return await this.roleService.createRole(request);
  }

  @Patch('role')
  @Roles(RoleTypes.ADMIN)
  async updateRole(@Body() request: UpdateRoleDto): Promise<RoleEnity> {
    return await this.roleService.updateRole(request);
  }

  @Delete('role/:id')
  @Roles(RoleTypes.ADMIN)
  async deleteRole(@Param('id') id: string): Promise<boolean> {
    return await this.roleService.deleteRole(id);
  }
}
