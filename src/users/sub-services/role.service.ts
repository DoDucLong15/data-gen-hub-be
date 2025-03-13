import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RoleEnity } from '../entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleTypes } from '../enums/role-types.enum';
import { CreateRoleDto, UpdateRoleDto } from '../dtos/role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEnity)
    private readonly roleRepository: Repository<RoleEnity>,
  ) {}

  async findRoleByName(name: string): Promise<RoleEnity> {
    const role = await this.roleRepository.findOne({
      where: { name },
    });
    if (!role) {
      throw new BadRequestException('Role not found');
    }
    return role;
  }

  async getRoles(): Promise<RoleEnity[]> {
    return await this.roleRepository.find();
  }

  async createRole(request: CreateRoleDto): Promise<RoleEnity> {
    const role = await this.roleRepository.findOne({
      where: { name: request.name },
    });
    if (role) {
      throw new BadRequestException('Role already exists');
    }
    return await this.roleRepository.save(request);
  }

  async updateRole(request: UpdateRoleDto): Promise<RoleEnity> {
    const role = await this.roleRepository.findOne({
      where: { id: request.id },
    });
    if (!role) {
      throw new BadRequestException('Role not found');
    }
    if (request.name && request.name !== role.name) {
      const roleExist = await this.roleRepository.findOne({
        where: { name: request.name },
      });
      if (roleExist) {
        throw new BadRequestException('Role already exists');
      }
    }
    return await this.roleRepository.save({
      ...role,
      ...request,
    });
  }

  async deleteRole(id: string): Promise<boolean> {
    const role = await this.roleRepository.findOne({
      where: { id },
    });
    if (!role) {
      throw new BadRequestException('Role not found');
    }
    await this.roleRepository.delete(id);
    return true;
  }
}
