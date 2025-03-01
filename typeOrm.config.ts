import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import { configuration } from './src/config/configuration';

const VALID_ENV = ['local', 'development', 'production'];
const environment = process.env.NODE_ENV ?? 'local';

config({
  path: `${process.cwd()}/env/.env.${VALID_ENV.includes(environment) ? environment : 'local'}`,
});

const configService = new ConfigService(configuration());

export default new DataSource({
  type: 'postgres',
  host: configService.get('database.host'),
  port: configService.get('database.port'),
  username: configService.get('database.user'),
  password: configService.get('database.password'),
  database: configService.get('database.db'),
  ssl: false,
  entities: ['src/**/entities/*.ts'],
  migrations: [],
});
