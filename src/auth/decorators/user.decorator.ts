import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser, UserPayload } from '../types/user-playload.type';

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext): UserPayload => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
});
