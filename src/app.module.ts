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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LogsMiddleware).forRoutes('*');
  }
}