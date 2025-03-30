import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpStatus,
  HttpException,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CronManagementService } from './cron-management.service';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';

@ApiTags('Cron Management')
@ApiBearerAuth()
@Controller('cron-management')
@UseGuards(AccessTokenGuard, PoliciesGuard)
export class CronManagementController {
  constructor(private readonly cronManagementService: CronManagementService) {}

  @Get()
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_CronManagement })
  async getAllJobs() {
    return this.cronManagementService.getCronJobs();
  }

  @Get(':jobName')
  @ApiParam({ name: 'jobName', description: 'Name of the cron job' })
  @CheckPolicies({ action: EAction.READ, subject: ESubject.System_CronManagement })
  async getJobStatus(@Param('jobName') jobName: string) {
    const allJobs = this.cronManagementService.getCronJobs();
    const job = allJobs.jobs.find((j) => j.name === jobName);

    if (!job) {
      throw new HttpException(`Job ${jobName} not found`, HttpStatus.NOT_FOUND);
    }

    const isRunning = this.cronManagementService.isJobRunning(jobName);

    return {
      ...job,
      isRunning,
    };
  }

  @Post(':jobName/trigger')
  @ApiParam({ name: 'jobName', description: 'Name of the cron job to trigger' })
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_CronManagement })
  async triggerJob(@Param('jobName') jobName: string) {
    try {
      // Check if job is already running
      if (this.cronManagementService.isJobRunning(jobName)) {
        throw new HttpException(`Job ${jobName} is already running`, HttpStatus.BAD_REQUEST);
      }

      // Trigger the job
      const result = await this.cronManagementService.triggerJob(jobName);

      return {
        status: 'success',
        message: `Job ${jobName} triggered successfully`,
        result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to trigger job ${jobName}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':jobName')
  @ApiParam({ name: 'jobName', description: 'Name of the cron job to unregister' })
  @CheckPolicies({ action: EAction.MANAGE, subject: ESubject.System_CronManagement })
  async unregisterJob(@Param('jobName') jobName: string) {
    try {
      // Check if job exists first
      const allJobs = this.cronManagementService.getCronJobs();
      const job = allJobs.jobs.find((j) => j.name === jobName);

      if (!job) {
        throw new HttpException(`Job ${jobName} not found`, HttpStatus.NOT_FOUND);
      }

      // Unregister the job
      this.cronManagementService.unregisterJob(jobName);

      return {
        status: 'success',
        message: `Job ${jobName} unregistered successfully`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to unregister job ${jobName}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
