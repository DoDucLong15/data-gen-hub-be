import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterEntity } from '../entities/register.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/user.dto';
import { UsersService } from '../users.service';
import { RoleService } from './role.service';
import { ApproveRegisterDto } from '../dtos/register.dto';
import { BaseResponse } from 'src/base/types/response.type';

@Injectable()
export class RegisterService {
  constructor(
    @InjectRepository(RegisterEntity)
    private readonly registerRepository: Repository<RegisterEntity>,
    private readonly usersService: UsersService,
    private readonly roleService: RoleService,
  ) {}

  async createRegister(request: CreateUserDto): Promise<RegisterEntity> {
    const existingRegister = await this.registerRepository.findOne({
      where: { email: request.email },
    });
    if (existingRegister) {
      throw new BadRequestException('User already exists');
    }
    return await this.registerRepository.save(request);
  }

  async getRegisters(
    options?: FindManyOptions<RegisterEntity> | undefined,
  ): Promise<RegisterEntity[]> {
    return await this.registerRepository.find(options);
  }

  async getRegister(options: FindOneOptions<RegisterEntity>): Promise<RegisterEntity | null> {
    return await this.registerRepository.findOne(options);
  }

  async rejectRegister(id: string): Promise<BaseResponse> {
    const register = await this.registerRepository.findOne({
      where: { id },
    });
    if (!register) throw new BadRequestException('Register not found');
    await this.registerRepository.delete(id);
    return {
      status: 'success',
      message: 'Register rejected successfully',
    };
  }

  async approveRegister(request: ApproveRegisterDto): Promise<BaseResponse> {
    const register = await this.registerRepository.findOne({
      where: { id: request.id },
    });
    if (!register) throw new BadRequestException('Register not found');
    const role = await this.roleService.getRoleById(request.roleId);
    await this.registerRepository.delete(request.id);
    await this.usersService.createUser({
      ...register,
      role: role.name,
    });
    return {
      status: 'success',
      message: 'Register approved successfully',
    };
  }
}
