import { RawRule } from '@casl/ability';
import { SetMetadata } from '@nestjs/common';

export const CHECK_POLICIES_V2_KEY = 'check_policy_v2';

export const CheckPoliciesV2 = (...requiredPolicies: RawRule[]) =>
  SetMetadata(CHECK_POLICIES_V2_KEY, requiredPolicies);
