import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemConfigEntity } from './entities/system-config.entity';
import { FindManyOptions, In, Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Timeout } from '@nestjs/schedule';
import {
  CreateSystemConfigDto,
  GetSystemConfigQueryDto,
  UpdateSystemConfigDto,
} from './dtos/system-config.dto';
import { Keys } from './constants/key.const';
import { SystemConfigUtils as SCU, SystemConfigUtils } from './utils/system-config.util';

@Injectable()
export class SystemConfigurationService {
  constructor(
    @InjectRepository(SystemConfigEntity)
    private readonly repository: Repository<SystemConfigEntity>,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('system.config.*')
  private onSystemConfigChange(payload: [SystemConfigEntity]): void {
    try {
      for (const config of payload) {
        if (config.key === Keys.LOGO_URL) {
          const stringValue = SCU.getString(config);
          if(stringValue) {
            SystemConfigUtils.logoUrl = stringValue;
            Logger.verbose(`Updated LOGO_URL ${stringValue}`, 'SystemConfigService');
          }
        } else if(config.key === Keys.SYSTEM_NAME) {
          const stringValue = SCU.getString(config);
          if(stringValue) {
            SystemConfigUtils.systemName = stringValue;
            Logger.verbose(`Updated SYSTEM_NAME ${stringValue}`, 'SystemConfigService');
          }
        } else if(config.key === Keys.LOGIN_URL) {
          const stringValue = SCU.getString(config);
          if(stringValue) {
            SystemConfigUtils.loginUrl = stringValue;
            Logger.verbose(`Updated LOGIN_URL ${stringValue}`, 'SystemConfigService');
          }
        }
      }
    } catch (error) {
      Logger.error('Error updating TICKET_MANAGEMENT_BASE_URL', error);
    }
  }

  @Timeout('InitSystemConfig', 100)
  private async emitInitialConfigurations(): Promise<void> {
    try {
      const configurations = await this.repository.find();
      this.eventEmitter.emit('system.config.initialize', configurations);
      Logger.verbose('Emitted initial configurations', 'SystemConfigService');
    } catch (error) {
      Logger.error('Failed to emit initial configurations', error);
    }
  }

  async get(key: string): Promise<SystemConfigEntity | null> {
    return await this.repository.findOne({ where: { key: key } });
  }

  async list(query: GetSystemConfigQueryDto): Promise<SystemConfigEntity[]> {
    const options: FindManyOptions<SystemConfigEntity> = {};
    if (query.keys && query.keys.length > 0) {
      options.where = { key: In(query.keys) };
    }
    return this.repository.find(options);
  }

  async create(data: CreateSystemConfigDto): Promise<SystemConfigEntity> {
    const entity = await this.repository.save({
      stringValue: null,
      numberValue: null,
      booleanValue: null,
      jsonValue: null,
      ...data,
    } as SystemConfigEntity);

    this.eventEmitter.emit('system.config.created', [entity]);
    return entity;
  }

  async delete(key: string): Promise<void> {
    const entity = await this.repository.findOne({ where: { key } });
    if (!entity) {
      throw new BadRequestException(`System configuration with key ${key} not found`);
    }

    await this.repository.delete({ key });
  }

  async update(dto: UpdateSystemConfigDto): Promise<SystemConfigEntity> {
    const { key, ...data } = dto;

    const entity = await this.repository.findOne({ where: { key } });
    if (!entity) {
      throw new BadRequestException(`System configuration with key ${key} not found`);
    }

    const newEntity = await this.repository.save({
      stringValue: null,
      numberValue: null,
      booleanValue: null,
      jsonValue: null,
      ...data,
      key,
    } as SystemConfigEntity);
    this.eventEmitter.emit('system.config.updated', [newEntity]);
    return newEntity;
  }
}
