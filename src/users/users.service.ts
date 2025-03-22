import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './dtos/user.dto';
import { RolesService } from 'src/roles/roles.service';
import { MapperUserResponse } from './helpers/mapper.helper';
import { UserResponse } from './types/user-response.type';
import { MailerService } from 'src/mailer/mailer.service';
import { SystemConfigUtils } from 'src/system-configuration/utils/system-config.util';
import { TemplateHelper } from 'src/mailer/helpers/template.helper';
import { UserPayload } from 'src/auth/types/user-playload.type';
import { RoleTypes } from './enums/role-types.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly roleService: RolesService,
    private readonly mailerService: MailerService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<UserResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException(`User ${dto.email} already exists`);
    }
    const role = await this.roleService.getRoleById(dto.roleId);
    const newUser = await this.userRepository.save({
      ...dto,
      role: role,
    });
    this.mailerService
      .sendEmail({
        to: newUser.email,
        subject: `Welcome to ${SystemConfigUtils.systemName}`,
        content: TemplateHelper.getTemplateNotifyNewUser(newUser.email),
      })
      .then((res) => Logger.verbose(`Send to ${newUser.email} success`, 'UsersService.createUser'))
      .catch((error) => {
        Logger.error(
          `Failed to send email to ${newUser.email}: ${error?.message}`,
          'UsersService.createUser',
        );
      });
    return MapperUserResponse(newUser);
  }

  async updateUserInfo(dto: UpdateUserDto, updateBy: UserPayload): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id: dto.id },
    });
    if (!user) {
      throw new BadRequestException(`User ${dto.id} not found`);
    }
    if (updateBy.role !== RoleTypes.ADMIN && updateBy.email !== user.email) {
      throw new BadRequestException(`You can't update this user`);
    }
    if (dto.role) {
      if (updateBy.role !== RoleTypes.ADMIN) {
        throw new BadRequestException(`You can't update role`);
      }
      const role = await this.roleService.findRoleByName(dto.role);
      if (!role) {
        throw new BadRequestException(`Role ${dto.role} not found`);
      }
      user.role = role;
    }
    delete dto.role;
    const userUpdate = await this.userRepository.save({
      ...user,
      ...dto,
    } as UserEntity);
    return MapperUserResponse({
      ...userUpdate,
      roleName: userUpdate.role.name,
    } as UserEntity);
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!user) {
      throw new BadRequestException(`User ${id} not found`);
    }
    if (!user.deletedAt) await this.userRepository.softDelete(id);
    else await this.userRepository.delete(id);
    return true;
  }

  async getUserInfo(email: string): Promise<UserResponse> {
    const user = await this.getUser({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException(`User ${email} not found`);
    }
    return MapperUserResponse(user);
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  async getUsers(options?: FindManyOptions<UserEntity> | undefined): Promise<UserEntity[]> {
    return await this.userRepository.find(options);
  }

  async getUser(options: FindOneOptions<UserEntity>): Promise<UserEntity | null> {
    return await this.userRepository.findOne(options);
  }
}
