import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ClassDriveInfoService } from 'src/class/sub-services/class-drive-info.service';
import { DriveApisService } from 'src/drive-apis/drive-apis.service';
import { OnedriveService } from 'src/onedrive/onedrive.service';

@Injectable()
export class CronManagementService {
  // Job status tracking map
  private jobLocks: Map<string, boolean> = new Map();

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly onedriveService: OnedriveService,
    private readonly driveApisService: DriveApisService,
    private readonly classDriveInfoService: ClassDriveInfoService,
  ) {
    // Initialize job locks
    this.initJobLocks();
  }

  /**
   * Initialize job locks for all registered jobs
   */
  private initJobLocks(): void {
    // Pre-defined list of job names
    const jobNames = ['refreshOnedriveAccessToken', 'healthCheckDrive', 'syncClassDriveData'];

    // Initialize all jobs as not running
    jobNames.forEach((jobName) => {
      this.jobLocks.set(jobName, false);
    });

    Logger.log('Job locks initialized', 'CronManagementService');
  }

  /**
   * Execute a job with locking mechanism
   * @param jobName Name of the job
   * @param jobFunction Async function to execute
   * @returns Result of the job function or null if skipped
   */
  private async executeWithLock<T>(
    jobName: string,
    jobFunction: () => Promise<T>,
  ): Promise<T | null> {
    // Check if job is already running
    if (this.jobLocks.get(jobName)) {
      Logger.warn(
        `Job ${jobName} is already running, skipping this execution`,
        'CronManagementService',
      );
      return null;
    }

    try {
      // Set lock to indicate job is running
      this.jobLocks.set(jobName, true);
      Logger.verbose(`Starting job: ${jobName}`, 'CronManagementService');

      // Execute the job
      const result = await jobFunction();

      Logger.verbose(`Job completed: ${jobName}`, 'CronManagementService');
      return result;
    } catch (error) {
      Logger.error(
        `Error executing job ${jobName}: ${error.message}`,
        error.stack,
        'CronManagementService',
      );
      return null;
    } finally {
      // Release lock regardless of success or failure
      this.jobLocks.set(jobName, false);
    }
  }

  /**
   * Unregister a job
   * @param jobName Name of the job to unregister
   */
  public unregisterJob(jobName: string): void {
    try {
      // Delete from the scheduler
      this.schedulerRegistry.deleteCronJob(jobName);

      // Remove from job locks
      this.jobLocks.delete(jobName);

      Logger.log(`Job ${jobName} unregistered`, 'CronManagementService');
    } catch (error) {
      Logger.error(
        `Failed to unregister job ${jobName}: ${error.message}`,
        error.stack,
        'CronManagementService',
      );
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async refreshOnedriveAccessToken() {
    return this.executeWithLock('refreshOnedriveAccessToken', async () => {
      Logger.verbose('Health check onedrive access token', 'CronManagementService');

      await this.onedriveService.healthCheckOnedrive().catch((error) => {
        Logger.error('Health check onedrive access token failed', error, 'CronManagementService');
      });

      Logger.verbose('Health check onedrive access token completed', 'CronManagementService');
    });
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async healthCheckDrive() {
    return this.executeWithLock('healthCheckDrive', async () => {
      Logger.verbose('Health check drive access token', 'CronManagementService');

      await this.driveApisService.healthCheck().catch((error) => {
        Logger.error('Health check drive access token failed', error, 'CronManagementService');
      });

      Logger.verbose('Health check drive access token completed', 'CronManagementService');
    });
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  async syncClassDriveData() {
    return this.executeWithLock('syncClassDriveData', async () => {
      Logger.verbose('Starting sync class drive data', 'CronManagementService');

      const result = await this.classDriveInfoService.syncClassDriveData();

      Logger.verbose(
        `Sync class drive data completed with status: ${result.status}`,
        'CronManagementService',
      );

      return result;
    });
  }

  /**
   * Get the status of all cron jobs
   */
  getCronJobs() {
    try {
      const jobs = this.schedulerRegistry.getCronJobs();
      const jobsList: any[] = [];

      jobs.forEach((value, key) => {
        const job = value as CronJob;
        const isLocked = this.jobLocks.get(key) || false;

        jobsList.push({
          name: key,
          lastExecution: job.lastDate(),
          nextExecution: job.nextDate(),
          running: isLocked, // Use our lock status instead of job.running
          cronTime: job.cronTime.source,
          active: job.running, // Is the job active (differs from running)
        });
      });

      return {
        total: jobsList.length,
        jobs: jobsList,
      };
    } catch (error) {
      Logger.error(
        `Failed to get cron jobs: ${error.message}`,
        error.stack,
        'CronManagementService',
      );

      throw new Error(`Failed to get cron jobs: ${error.message}`);
    }
  }

  /**
   * Manually trigger a job by name
   * @param jobName Name of the job to trigger
   */
  async triggerJob(jobName: string): Promise<any> {
    try {
      // Check if job exists
      if (!this.jobLocks.has(jobName)) {
        throw new Error(`Job ${jobName} does not exist`);
      }

      // Get the job function based on job name
      let jobFunction: () => Promise<any>;

      switch (jobName) {
        case 'refreshOnedriveAccessToken':
          jobFunction = async () => {
            return this.onedriveService.healthCheckOnedrive();
          };
          break;
        case 'healthCheckDrive':
          jobFunction = async () => {
            return this.driveApisService.healthCheck();
          };
          break;
        case 'syncClassDriveData':
          jobFunction = async () => {
            return this.classDriveInfoService.syncClassDriveData();
          };
          break;
        default:
          throw new Error(`No implementation found for job ${jobName}`);
      }

      // Execute the job with lock
      return this.executeWithLock(jobName, jobFunction);
    } catch (error) {
      Logger.error(
        `Failed to trigger job ${jobName}: ${error.message}`,
        error.stack,
        'CronManagementService',
      );

      throw new Error(`Failed to trigger job ${jobName}: ${error.message}`);
    }
  }

  /**
   * Check if a job is currently running
   * @param jobName Name of the job
   */
  isJobRunning(jobName: string): boolean {
    return this.jobLocks.get(jobName) || false;
  }
}
