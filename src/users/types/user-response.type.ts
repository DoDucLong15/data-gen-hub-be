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
};
