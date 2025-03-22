import { AbilityTuple, MongoAbility, MongoQuery, RawRule } from '@casl/ability';

export type AuthorizationRule = {
  action: string;
  subject: string;
  fields?: string[];
  conditions?: any;
};

export class AbilityHelper {
  static canAction(ability: MongoAbility<AbilityTuple, MongoQuery>, rule: AuthorizationRule) {
    const missingPermissions = [];
    const ruleWithPrefix: AuthorizationRule[] = [];
    if (rule.subject.split('.').length > 1) {
      ruleWithPrefix.push(rule);
    }
    if (rule.fields) {
      for (const field of rule.fields) {
        if (ability.cannot(rule.action, rule.subject, { field, ...(rule.conditions ?? {}) })) {
          missingPermissions.push(rule);
        }
      }
    } else {
      if (ability.cannot(rule.action, rule.subject, rule.conditions)) {
        missingPermissions.push(rule);
      }
    }
    for (const rule of ruleWithPrefix) {
      let isAble = false;
      const prefixes = getPrefixes(rule.subject);
      for (const prefix of prefixes) {
        if (!rule.fields) {
          if (ability.can(rule.action, prefix, rule.conditions)) {
            isAble = true;
            break;
          }
        }
        if (
          rule.fields?.every((item) =>
            ability.can(rule.action, prefix, { field: item, ...(rule.conditions ?? {}) }),
          )
        ) {
          isAble = true;
          break;
        }
      }
      if (!isAble) {
        missingPermissions.push(rule);
      }
    }

    if (missingPermissions.length) {
      return false;
    }
    return true;
  }
}

export function getPrefixes(str: string): string[] {
  if (!str || !str.includes('.')) {
    return [];
  }

  const parts = str.split('.');
  const prefixes: string[] = [];

  let currentPrefix = '';
  for (const part of parts) {
    currentPrefix += part + '.';
    prefixes.push(currentPrefix.slice(0, -1));
  }

  return prefixes;
}
