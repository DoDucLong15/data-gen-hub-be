import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from './dtos/user.dto';
import { UserResponse } from './types/user-response.type';
import { MapperUserResponse } from './helpers/mapper.helper';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ADMIN
  @Post()
  async createUser(@Body() request: CreateUserDto): Promise<UserResponse> {
    return await this.usersService.createUser(request);
  }

  // USER
  @Patch()
  async updateUser(@Body() request: UpdateUserDto): Promise<UserResponse> {
    return await this.usersService.updateUserInfo(request);
  }

  // USER
  @Get(':email')
  async getUserInfo(@Param('email') email: string): Promise<UserResponse> {
    return await this.usersService.getUserInfo(email);
  }

  // ADMIN
  @Get()
  async getAllUsers(): Promise<UserResponse[]> {
    return await this.usersService.getUsers({
      order: {createdAt: 'DESC'}
    }).then(users => users.map(MapperUserResponse));
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<boolean> {
    return await this.usersService.deleteUser(id);
  }
}
