import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';

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
    DatabaseModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
