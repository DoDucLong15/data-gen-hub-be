import { Module } from '@nestjs/common';
import { CronManagementService } from './cron-management.service';
import { CronManagementController } from './cron-management.controller';
import { UsersModule } from 'src/users/users.module';
import { OnedriveModule } from 'src/onedrive/onedrive.module';
import { DriveApisModule } from 'src/drive-apis/drive-apis.module';
import { ClassModule } from 'src/class/class.module';

@Module({
  imports: [OnedriveModule, UsersModule, DriveApisModule, ClassModule],
  controllers: [CronManagementController],
  providers: [CronManagementService],
})
export class CronManagementModule {}
