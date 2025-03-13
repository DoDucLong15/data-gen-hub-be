import { UserEntity } from '../entities/user.entity';
import { UserResponse } from '../types/user-response.type';

export const MapperUserResponse = (user: UserEntity): UserResponse => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    school: user.school,
    department: user.department,
    position: user.position,
    role: user.roleName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
