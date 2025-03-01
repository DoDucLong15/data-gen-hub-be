import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setup } from './setup';
import { ConfigService } from '@nestjs/config';
import { configuration } from './config/configuration';
import { Logger } from '@nestjs/common';

const configService = new ConfigService(configuration());

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  setup(app);

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing the application.');
    await app.close();
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing the application.');
    await app.close();
  });

  const PORT = configService.get('port') || 8000;
  await app.listen(PORT, () => Logger.debug(`Server is running on port ${PORT}`, 'main.ts'));
}
bootstrap();