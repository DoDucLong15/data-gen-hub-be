import { Module } from '@nestjs/common';
import { CronManagementService } from './cron-management.service';
import { CronManagementController } from './cron-management.controller';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [CronManagementController],
  providers: [CronManagementService],
})
export class CronManagementModule {}
