import { Module } from '@nestjs/common';
import { OnedriveService } from './onedrive.service';
import { OnedriveController } from './onedrive.controller';
import { SystemConfigurationModule } from 'src/system-configuration/system-configuration.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [SystemConfigurationModule, UsersModule],
  controllers: [OnedriveController],
  providers: [OnedriveService],
  exports: [OnedriveService],
})
export class OnedriveModule {}
