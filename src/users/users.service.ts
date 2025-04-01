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
import { PermissionEntity } from 'src/permissions/entities/permission.entity';
import {
  AbilityBuilder,
  AbilityTuple,
  createMongoAbility,
  MongoAbility,
  MongoQuery,
} from '@casl/ability';
import { AbilityHelper } from 'src/authorization/helpers/ability.helper';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { EAction } from 'src/permissions/enums/action.enum';

@Injectable()
export class UsersService {
  private principalAbility: Record<
    string,
    { time: number; ability: MongoAbility<AbilityTuple, MongoQuery> }
  > = {};
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
    const principalAbility = await this.createPrincipalAbility(updateBy.email);
    const user = await this.userRepository.findOne({
      where: { id: dto.id },
    });
    if (!user) {
      throw new BadRequestException(`User ${dto.id} not found`);
    }
    if (
      !AbilityHelper.canAction(principalAbility, {
        action: EAction.MANAGE,
        subject: ESubject.System_Users,
      }) &&
      updateBy.email !== user.email
    ) {
      throw new BadRequestException(`You can't update this user`);
    }
    if (dto.roleId) {
      if (
        !AbilityHelper.canAction(principalAbility, {
          action: EAction.MANAGE,
          subject: ESubject.System_Users,
        })
      ) {
        throw new BadRequestException(`You can't update role`);
      }
      const role = await this.roleService.getRoleById(dto.roleId);
      if (!role) {
        throw new BadRequestException(`Role ${dto.roleId} not found`);
      }
      user.role = role;
    }

    if (dto.email) {
      if (
        !AbilityHelper.canAction(principalAbility, {
          action: EAction.MANAGE,
          subject: ESubject.System_Users,
        })
      ) {
        throw new BadRequestException(`You can't update email`);
      }
      user.email = dto.email;
    }
    const userUpdate = await this.userRepository.save({
      ...user,
      ...dto,
    });
    return MapperUserResponse({
      ...userUpdate,
      roleName: user.role.name,
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

  async getPrincipalAbility(email: string): Promise<MongoAbility<AbilityTuple, MongoQuery>> {
    const key = `${email}`;
    let ability = this.principalAbility[key]?.ability;
    if (!this.principalAbility[key] || this.principalAbility[key].time < Date.now() - 10000) {
      const newAbility = await this.createPrincipalAbility(email);
      ability = newAbility;
      this.principalAbility[key] = { time: Date.now(), ability: newAbility };
    }
    return ability;
  }

  async createPrincipalAbility(email: string): Promise<MongoAbility<AbilityTuple, MongoQuery>> {
    const principalWithPermissions = await this.getUser({
      where: {
        email: email,
      },
    });
    if (!principalWithPermissions || principalWithPermissions == null) {
      throw new BadRequestException(`Principal with email ${email} not found.`);
    }
    return await this.defineAbility(principalWithPermissions);
  }

  async defineAbility(
    principalWithPermissions: UserEntity,
  ): Promise<MongoAbility<AbilityTuple, MongoQuery>> {
    const permissions: PermissionEntity[] = principalWithPermissions.role.permissions;
    const { can, build } = new AbilityBuilder(createMongoAbility);
    permissions.forEach((permission) => {
      can(
        permission.action,
        permission.subject,
        permission.fields ?? '*',
        permission.conditions ? JSON.parse(permission.conditions) : undefined,
      );
    });
    return build();
  }
}
