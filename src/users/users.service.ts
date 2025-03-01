import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './dtos/user.dto';
import { RoleService } from './sub-services/role.service';
import { MapperUserResponse } from './helpers/mapper.helper';
import { UserResponse } from './types/user-response.type';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly roleService: RoleService
  ){}

  async createUser(dto: CreateUserDto): Promise<UserResponse> {
    const existingUser = await this.userRepository.findOne({
      where: {email: dto.email}
    })
    if(existingUser) {
      throw new BadRequestException(`User ${dto.email} already exists`);
    }
    const role = await this.roleService.findRoleByName(dto.role);
    const newUser = await this.userRepository.save({
      ...dto,
      role: role
    })
    return MapperUserResponse(newUser);
  }

  async updateUserInfo(dto: UpdateUserDto): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: {id: dto.id}
    })
    if(!user) {
      throw new BadRequestException(`User ${dto.id} not found`);
    }
    const userUpdate = await this.userRepository.save({
      ...user,
      ...dto,
    })
    return MapperUserResponse(userUpdate);
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: {id}
    })
    if(!user) {
      throw new BadRequestException(`User ${id} not found`);
    }
    await this.userRepository.softDelete(id);
    return true;
  }

  async getUserInfo(email: string): Promise<UserResponse> {
    const user = await this.getUser({
      where: {email}
    })
    if(!user) {
      throw new BadRequestException(`User ${email} not found`);
    }
    return MapperUserResponse(user);
  }

  async getUsers(options?: FindManyOptions<UserEntity> | undefined): Promise<UserEntity[]> {
    return await this.userRepository.find(options);
  }

  async getUser(options: FindOneOptions<UserEntity>): Promise<UserEntity | null> {
    return await this.userRepository.findOne(options);
  }
}
