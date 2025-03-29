import { Module } from '@nestjs/common';
import { DriveApisService } from './drive-apis.service';
import { DriveApisController } from './drive-apis.controller';
import { SystemConfigurationModule } from 'src/system-configuration/system-configuration.module';
import { UsersModule } from 'src/users/users.module';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [SystemConfigurationModule, UsersModule, MailerModule],
  controllers: [DriveApisController],
  providers: [DriveApisService],
  exports: [DriveApisService],
})
export class DriveApisModule {}
