import { Module } from '@nestjs/common';
import { CronManagementService } from './cron-management.service';
import { CronManagementController } from './cron-management.controller';
import { UsersModule } from 'src/users/users.module';
import { OnedriveModule } from 'src/onedrive/onedrive.module';
import { DriveApisModule } from 'src/drive-apis/drive-apis.module';

@Module({
  imports: [OnedriveModule, UsersModule, DriveApisModule],
  controllers: [CronManagementController],
  providers: [CronManagementService],
})
export class CronManagementModule {}
