import { Inject, Logger } from '@nestjs/common';
import { CommonUtils } from 'src/utils/common.util';

export function ApplyCachingMetric(ttl: number = 60 * 10): MethodDecorator {
  const redisClient = Inject('REDIS_CLIENT');
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): any => {
    redisClient(target, 'redisClient');
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]): Promise<any> {
      const key = CommonUtils.getKeyValueFromObject(propertyKey, ...args);
      let response = await this.redisClient.get(key);
      if (!response) {
        response = await originalMethod.apply(this, args);

        try {
          await this.redisClient.set(key, JSON.stringify(response), 'EX', ttl, 'NX');
        } catch (error) {
          Logger.error(error, 'Redis caching error');
        }
        return response;
      }
      return JSON.parse(response);
    };
  };
}
