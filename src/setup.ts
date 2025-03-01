import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { setupSwagger } from './config/swagger.config';
import { initFirebaseAdmin } from './config/firebase.config';

export function setup(app: INestApplication): INestApplication {
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({
    credentials: true,
    exposedHeaders: ['Authorization'],
  });
  initFirebaseAdmin();
  setupSwagger(app);

  return app;
}
