import { RoleTypes } from 'src/users/enums/role-types.enum';

export type UserPayload = {
  email: string;
  role: string;
};

export class RequestWithUser extends Request {
  user: UserPayload;
}
