import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProgressEntity } from './entities/progress.entity';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { DateUtils } from 'src/utils/date.utils';
import { CommonUtils } from 'src/utils/common.util';
import { EProgressStatus } from './constant/progress.const';
import { OmitFields, RequiredFields } from 'src/base/types/custom.type';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(ProgressEntity)
    private readonly repository: Repository<ProgressEntity>,
  ) {}

  static generateId(prefix?: string): string {
    const currentDate = DateUtils.getTodayWithTimezone(7);
    return `${prefix || 'progress'}-${currentDate}-${Math.random().toString(36).slice(2)}`;
  }

  private transformError(error: any): any {
    if (!error) return error;

    if (typeof error === 'object') {
      if (CommonUtils.isEmptyObj(error)) return null;

      return Object.entries(error).reduce((acc: any, [key, value]) => {
        acc[key] = CommonUtils.transformError(value).message;
        return acc;
      }, {});
    }
    return { unknown: CommonUtils.transformError(error).message };
  }

  async createProgress(data: DeepPartial<ProgressEntity>[]): Promise<ProgressEntity[]> {
    return await this.repository.save(
      data.map((item) => ({ ...item, status: EProgressStatus.PROCESSING })),
    );
  }

  private update(
    condition: FindOptionsWhere<ProgressEntity>,
    data: DeepPartial<ProgressEntity>,
  ): Promise<any> {
    return this.repository.update(
      { ...condition },
      { ...data, error: this.transformError(data.error) },
    );
  }

  async makeCompleted(
    condition: RequiredFields<FindOptionsWhere<ProgressEntity>, 'processId'>,
    data: DeepPartial<OmitFields<ProgressEntity, 'status'>>,
  ): Promise<any> {
    return this.update(
      { ...condition, status: EProgressStatus.PROCESSING },
      { ...data, status: EProgressStatus.COMPLETED },
    ).catch((error) => Logger.error(error, `${this.constructor.name}.makeCompleted`));
  }

  async makeFailed(
    condition: RequiredFields<FindOptionsWhere<ProgressEntity>, 'processId'>,
    data: RequiredFields<DeepPartial<OmitFields<ProgressEntity, 'status'>>, 'error'>,
  ): Promise<number | void> {
    return this.update(
      { ...condition, status: EProgressStatus.PROCESSING },
      { ...data, status: EProgressStatus.FAILED },
    ).catch((error) => Logger.error(error, `${this.constructor.name}.makeFailed`));
  }

  async abort(
    condition: FindOptionsWhere<ProgressEntity>,
    error: ProgressEntity['error'],
  ): Promise<number | void> {
    return this.update(
      { ...condition, status: EProgressStatus.PROCESSING },
      { status: EProgressStatus.FAILED, error },
    ).catch((error) => Logger.error(error, `${this.constructor.name}.abort`));
  }

  async getMany(options?: FindManyOptions<ProgressEntity> | undefined): Promise<ProgressEntity[]> {
    return await this.repository.find(options);
  }
}
