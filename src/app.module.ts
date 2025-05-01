import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { LogsMiddleware } from './base/middlewares/logs.middleware';
import { StorageModule } from './storage/storage.module';
import { MailerModule } from './mailer/mailer.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SystemConfigurationModule } from './system-configuration/system-configuration.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClassModule } from './class/class.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TemplateSpecificationModule } from './template-specification/template-specification.module';
import { OfficeModule } from './office/office.module';
import { StudentsModule } from './students/students.module';
import { ThesisManagementModule } from './thesis-management/thesis-management.module';
import { PythonScriptModule } from './python-script/python-script.module';
import { StudentModuleV2 } from './student-v2/student-v2.module';
import { ProgressModule } from './progress/progress.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { MockModule } from './mock/mock.module';
import { OnedriveModule } from './onedrive/onedrive.module';
import { CronManagementModule } from './cron-management/cron-management.module';
import { DriveApisModule } from './drive-apis/drive-apis.module';
import { CompressionMiddleware } from './base/middlewares/compression.middleware';
import { RedisModule } from './base/modules/redis.module';

const VALID_ENV = ['local', 'development', 'production'];

const environment = process.env.NODE_ENV ?? 'local';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.cwd()}/env/.env.${
        VALID_ENV.includes(environment) ? environment : 'local'
      }`,
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    StorageModule,
    MailerModule,
    UsersModule,
    AuthModule,
    SystemConfigurationModule,
    EventEmitterModule.forRoot({
      global: true,
      wildcard: true,
      maxListeners: 20,
    }),
    ClassModule,
    ScheduleModule.forRoot(),
    TemplateSpecificationModule,
    OfficeModule,
    StudentsModule,
    ThesisManagementModule,
    PythonScriptModule,
    StudentModuleV2,
    ProgressModule,
    RolesModule,
    PermissionsModule,
    AuthorizationModule,
    MockModule,
    OnedriveModule,
    CronManagementModule,
    DriveApisModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LogsMiddleware, CompressionMiddleware).forRoutes('*');
  }
}
