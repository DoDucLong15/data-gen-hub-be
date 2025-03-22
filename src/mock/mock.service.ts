import { Injectable, Logger } from '@nestjs/common';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { EAction } from 'src/permissions/enums/action.enum';
import { PermissionsService } from 'src/permissions/permissions.service';
import { RolesService } from 'src/roles/roles.service';
import { CreateUserDto } from 'src/users/dtos/user.dto';
import { RoleTypes } from 'src/users/enums/role-types.enum';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class MockService {
  constructor(
    private readonly roleService: RolesService,
    private readonly userService: UsersService,
    private readonly permissionService: PermissionsService,
  ) {}

  private async createAdminUser(roleId: string): Promise<void> {
    const emailAdmin = process.env.EMAIL_ADMIN;
    if (!emailAdmin || !this.isValidEmail(emailAdmin)) {
      Logger.warn('Invalid or missing EMAIL_ADMIN in environment variables');
      return;
    }

    try {
      await this.userService.createUser({
        email: emailAdmin,
        name: 'Admin',
        roleId: roleId,
      } as CreateUserDto);
    } catch (error) {
      if (error.message.includes('already exists')) {
        Logger.warn(`User ${emailAdmin} already exists`, 'MockService.createAdminUser');
      } else {
        Logger.error(
          `Error when create user ${emailAdmin}: ${error.message}`,
          'MockService.createAdminUser',
        );
      }
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async mockRoleUserPermission() {
    // Wrap all operations in a transaction
    try {
      // Create Permission
      const subjects = Object.values(ESubject);
      const permissionsManage = [];

      // Create permissions
      for (const subject of subjects) {
        try {
          const permissionManage = await this.permissionService.createPermission({
            action: EAction.MANAGE,
            subject,
          });
          permissionsManage.push(permissionManage);

          await this.permissionService.createPermission({
            action: EAction.READ,
            subject,
          });
        } catch (error) {
          if (error.message.includes('Permission already exists.')) {
            // If permission exists, fetch and add to permissionsManage array
            const existingPermission = await this.permissionService.getPermission({
              where: {
                action: EAction.MANAGE,
                subject,
              },
            });
            if (existingPermission) {
              permissionsManage.push(existingPermission);
            }
            continue;
          }
          Logger.error(
            `Error when create permission ${subject}: ${error.message}`,
            'MockService.mockRoleUserPermission',
          );
        }
      }

      // Create or update Admin role
      try {
        const newAdmin = await this.roleService.createRole({
          name: RoleTypes.ADMIN,
          description: 'Administrator',
          permissionIds: permissionsManage.map((permission) => permission.id),
        });

        await this.createAdminUser(newAdmin.id);
      } catch (error) {
        if (error.message.includes('Role already exists')) {
          const admin = await this.roleService.getRole({
            where: { name: RoleTypes.ADMIN },
          });

          if (!admin) {
            throw new Error(`Role ${RoleTypes.ADMIN} not found`);
          }

          await this.roleService.updateRole({
            id: admin.id,
            permissionIds: permissionsManage.map((permission) => permission.id),
          });

          await this.createAdminUser(admin.id);
        } else {
          throw error;
        }
      }
    } catch (error) {
      Logger.error(
        `Failed to complete mockRoleUserPermission: ${error.message}`,
        'MockService.mockRoleUserPermission',
      );
      throw error;
    }
  }
}
