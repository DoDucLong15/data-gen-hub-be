import { RawRule } from '@casl/ability';
import { SetMetadata } from '@nestjs/common';

export const CHECK_POLICIES_KEY = 'check_policy';

export const CheckPolicies = (...requiredPolicies: RawRule[]) =>
  SetMetadata(CHECK_POLICIES_KEY, requiredPolicies);
