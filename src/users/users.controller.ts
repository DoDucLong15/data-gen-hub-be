import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AccessTokenGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ADMIN
  @Post()
  @Roles(RoleTypes.ADMIN)
  async createUser(@Body() request: CreateUserDto): Promise<UserResponse> {
    return await this.usersService.createUser(request);
  }

  @Patch()
  async updateUser(@Body() request: UpdateUserDto): Promise<UserResponse> {
    return await this.usersService.updateUserInfo(request);
  }

  @Get('me')
  async getUserInfo(@User() user: UserPayload): Promise<UserResponse> {
    return await this.usersService.getUserInfo(user.email);
  }

  @Get()
  @Roles(RoleTypes.ADMIN)
  async getAllUsers(): Promise<UserResponse[]> {
    return await this.usersService.getUsers({
      order: {createdAt: 'DESC'}
    }).then(users => users.map(MapperUserResponse));
  }

  @Delete(':id')
  @Roles(RoleTypes.ADMIN)
  async deleteUser(@Param('id') id: string): Promise<boolean> {
    return await this.usersService.deleteUser(id);
  }
}
