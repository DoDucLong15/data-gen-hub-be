import { Module } from '@nestjs/common';
import { CronManagementService } from './cron-management.service';
import { CronManagementController } from './cron-management.controller';
import { UsersModule } from 'src/users/users.module';
import { OnedriveModule } from 'src/onedrive/onedrive.module';

@Module({
  imports: [OnedriveModule, UsersModule],
  controllers: [CronManagementController],
  providers: [CronManagementService],
})
export class CronManagementModule {}
