import { SetMetadata } from '@nestjs/common';
import { RoleTypes } from 'src/users/enums/role-types.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleTypes[]) => SetMetadata(ROLES_KEY, roles);