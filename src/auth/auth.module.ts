import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { MailerModule } from 'src/mailer/mailer.module';
import { SystemConfigurationModule } from 'src/system-configuration/system-configuration.module';
import { OnedriveModule } from 'src/onedrive/onedrive.module';

@Module({
  imports: [JwtModule.register({}), UsersModule, PassportModule, MailerModule, OnedriveModule],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}
