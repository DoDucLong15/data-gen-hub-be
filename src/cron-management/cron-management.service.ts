import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { OnedriveService } from 'src/onedrive/onedrive.service';

@Injectable()
export class CronManagementService {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly onedriveService: OnedriveService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async refreshOnedriveAccessToken() {
    Logger.verbose('Health check onedrive access token', `CronManagementService`);
    await this.onedriveService.healthCheckOnedrive().catch((error) => {
      Logger.error('Health check onedrive access token failed', error, `CronManagementService`);
    });
    Logger.verbose('Health check onedrive access token completed', `CronManagementService`);
  }

  getCronJobs() {
    try {
      const jobs = this.schedulerRegistry.getCronJobs();
      const jobsList: any[] = [];

      jobs.forEach((value, key) => {
        const job = value as CronJob;
        jobsList.push({
          name: key,
          lastExecution: job.lastDate(),
          nextExecution: job.nextDate(),
          running: job.running,
          cronTime: job.cronTime.source,
        });
      });

      return {
        total: jobsList.length,
        jobs: jobsList,
      };
    } catch (error) {
      throw new Error(`Failed to get cron jobs: ${error.message}`);
    }
  }
}
