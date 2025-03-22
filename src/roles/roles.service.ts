import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEnity } from './entities/role.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { UpdateRoleDto } from './dtos/role.dto';
import { CreateRoleDto } from './dtos/role.dto';

@Injectable()
export class RolesService {
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

  async getRoles(options?: FindManyOptions<RoleEnity> | undefined): Promise<RoleEnity[]> {
    return await this.roleRepository.find(options);
  }

  async getRoleById(id: string): Promise<RoleEnity> {
    const role = await this.roleRepository.findOne({
      where: { id },
    });
    if (!role) throw new BadRequestException('Role not found');
    return role;
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
