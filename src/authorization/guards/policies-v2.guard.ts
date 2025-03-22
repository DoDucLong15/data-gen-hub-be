import { RawRule } from '@casl/ability';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHECK_POLICIES_KEY } from '../decorators/check-policies.decorator';
import { RequestWithUser } from 'src/auth/types/user-playload.type';
import { UsersService } from 'src/users/users.service';
import { AbilityHelper } from '../helpers/ability.helper';
import { CHECK_POLICIES_V2_KEY } from '../decorators/check-policies-v2.decorator';

@Injectable()
export class PoliciesGuardV2 implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(UsersService)
    private readonly userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyList =
      this.reflector.getAllAndOverride<RawRule[]>(CHECK_POLICIES_V2_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];
    if (policyList.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const ability = await this.userService.getPrincipalAbility(request.user.email as string);

    const missingPolicies = [];
    for (const policy of policyList) {
      const { action, subject, fields, conditions } = policy;
      if (
        !AbilityHelper.canAction(ability, {
          action: action as string,
          subject: subject as string,
          fields: fields as string[],
          conditions: conditions,
        })
      ) {
        missingPolicies.push(policy);
      }
    }

    if (missingPolicies.length === policyList.length) {
      throw new ForbiddenException(`You don't have permission`);
    }

    return true;
  }
}
