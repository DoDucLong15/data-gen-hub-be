import { CommonUtils } from 'src/utils/common.util';
import { SystemConfigEntity } from '../entities/system-config.entity';
import { InternalServerErrorException, Logger } from '@nestjs/common';

export class SystemConfigUtils {
  public static logoUrl: string;
  public static systemName: string;
  public static loginUrl: string;
  
  static getValue(entity: SystemConfigEntity): string | number | boolean | any {
    if (CommonUtils.isNotNullish(entity.stringValue)) return entity.stringValue;
    if (CommonUtils.isNotNullish(entity.booleanValue)) return entity.booleanValue;
    if (CommonUtils.isNotNullish(entity.numberValue)) return entity.numberValue;
    if (CommonUtils.isNotNullish(entity.jsonValue)) return entity.jsonValue;
    throw new InternalServerErrorException(`${entity.key} has no value`);
  }

  static getInt(entity: SystemConfigEntity): number | null {
    try {
      return parseInt(this.getValue(entity));
    } catch (error) {
      Logger.error(error, 'SystemConfigEntity.getInt');
      return null;
    }
  }

  static getDouble(entity: SystemConfigEntity): number | null {
    try {
      return parseFloat(this.getValue(entity));
    } catch (error) {
      Logger.error(error, 'SystemConfigEntity.getDouble');
      return null;
    }
  }

  static getBoolean(entity: SystemConfigEntity): boolean | null {
    try {
      const value = this.getValue(entity);
      return value === 'true' || value === true;
    } catch (error) {
      Logger.error(error, 'SystemConfigEntity.getBoolean');
      return null;
    }
  }

  static getString(entity: SystemConfigEntity): string | null {
    try {
      return this.getValue(entity).toString();
    } catch (error) {
      Logger.error(error, 'SystemConfigEntity.getString');
      return null;
    }
  }

  static getJson<T = any>(entity: SystemConfigEntity): T | null {
    try {
      return entity.jsonValue;
    } catch (error) {
      Logger.error(error, 'SystemConfigEntity.getJson');
      return null;
    }
  }
}
