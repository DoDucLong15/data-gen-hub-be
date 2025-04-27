import { TImageInfo } from 'src/utils/types/image-info.type';

export type UserResponse = {
  id: string;
  email: string;
  name: string;
  phone: string;
  school: string;
  department: string;
  position: string;
  role: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  permissions?: {
    action: string;
    subject: string;
  }[];
  avatar: TImageInfo | null;
};
