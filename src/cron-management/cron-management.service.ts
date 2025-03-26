import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { AuthService } from 'src/auth/auth.service';
import { CronJob } from 'cron';

@Injectable()
export class CronManagementService {
  constructor(
    private readonly authService: AuthService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async refreshOnedriveAccessToken() {
    Logger.verbose('Health check onedrive access token', `CronManagementService`);
    await this.authService.healthCheckOnedrive().catch((error) => {
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
