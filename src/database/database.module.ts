import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import fs from 'fs';

const VALID_ENV = ['local', 'development', 'production'];

const environment = process.env.NODE_ENV ?? 'local';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: function (configService: ConfigService): TypeOrmModuleOptions {
        const result: TypeOrmModuleOptions = {
          type: 'postgres',
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.user'),
          password: configService.get('database.password'),
          database: configService.get('database.db'),
          ssl: false,
          autoLoadEntities: true,
          synchronize: environment === 'development' ? false : true,
        };
        return result;
      },
    }),
  ],
})
export class DatabaseModule {}