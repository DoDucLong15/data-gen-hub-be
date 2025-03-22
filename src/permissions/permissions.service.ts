import { BadRequestException, Injectable } from '@nestjs/common';
import { PermissionEntity } from './entities/permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, In, Repository } from 'typeorm';
import { CreatePermissionDto, UpdatePermissionDto } from './dtos/permission.dto';
import { BaseResponse } from 'src/base/types/response.type';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  async getPermission(options: FindOneOptions<PermissionEntity>): Promise<PermissionEntity | null> {
    return await this.permissionRepository.findOne(options);
  }

  async getPermissions(options?: FindManyOptions<PermissionEntity>): Promise<PermissionEntity[]> {
    return await this.permissionRepository.find(options);
  }

  async createPermission(dto: CreatePermissionDto): Promise<PermissionEntity> {
    const permission = await this.getPermission({
      where: {
        subject: dto.subject,
        action: dto.action,
        fields: dto.fields,
        conditions: dto.conditions,
      },
    });
    if (permission) {
      throw new BadRequestException(`Permission already exists.`);
    }
    const newPermission = {
      action: dto.action,
      subject: dto.subject,
      fields: dto.fields,
      conditions: dto.conditions,
    } as PermissionEntity;
    return await this.permissionRepository.save(newPermission);
  }

  async updatePermission(dto: UpdatePermissionDto): Promise<PermissionEntity> {
    const permission = await this.getPermission({
      where: {
        id: dto.id,
      },
    });
    if (!permission) {
      throw new BadRequestException(`Permission does not exist.`);
    }
    const updatedPermission = {
      ...permission,
      action: dto.action ?? permission.action,
      subject: dto.subject ?? permission.subject,
      fields: dto.fields ?? permission.fields,
    } as PermissionEntity;
    return await this.permissionRepository.save(updatedPermission);
  }

  async deletePermission(id: string): Promise<BaseResponse> {
    const permission = await this.getPermission({
      where: { id: id },
    });
    if (!permission) {
      throw new BadRequestException(`Permission not found.`);
    }
    await this.permissionRepository.delete(id);
    return {
      status: 'success',
      message: 'Permission deleted successfully.',
    };
  }
}
