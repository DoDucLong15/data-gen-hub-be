import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';

const api_documentation_credentials = {
  name: 'admin',
  pass: 'admin',
};

export function setupSwagger(app: INestApplication): INestApplication {
  // Chỉ config sub path qua environment variable
  const apiPrefix = process.env.API_PREFIX || ''; // Default là empty, production set thành '/apis'

  const config = new DocumentBuilder()
    .setTitle('Swagger Api')
    .setDescription('## API Document')
    .setVersion('1.0')
    .addTag('Default')
    .addBearerAuth()
    .addSecurity('token', { type: 'http', scheme: 'bearer' })
    .addServer(apiPrefix || '/', apiPrefix ? `Current Domain + ${apiPrefix}` : 'Current Domain')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const http_adapter = app.getHttpAdapter();

  // Dynamic server detection middleware
  http_adapter.use('/api-docs', (req: Request, res: Response, next: NextFunction) => {
    // Auto-detect base URL from current request
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const currentBaseUrl = `${protocol}://${host}`;

    // Inject dynamic server vào Swagger document
    if (req.url === '/api-docs/swagger.json' || req.url === '/api-docs-json') {
      const dynamicDocument = {
        ...document,
        servers: [
          {
            url: apiPrefix ? `${currentBaseUrl}${apiPrefix}` : currentBaseUrl,
            description: 'Current Environment',
          },
        ],
      };
      res.setHeader('Content-Type', 'application/json');
      return res.send(JSON.stringify(dynamicDocument, null, 2));
    }

    next();
  });

  http_adapter.use('/api-docs', (req: Request, res: Response, next: NextFunction) => {
    function parseAuthHeader(input: string): { name: string; pass: string } {
      const [, encodedPart] = input.split(' ');

      const buff = Buffer.from(encodedPart, 'base64');
      const text = buff.toString('ascii');
      const [name, pass] = text.split(':');

      return { name, pass };
    }

    function unauthorizedResponse(): void {
      if (http_adapter.getType() === 'fastify') {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic');
      } else {
        res.status(401);
        res.set('WWW-Authenticate', 'Basic');
      }

      next();
    }

    if (!req.headers.authorization) {
      return unauthorizedResponse();
    }

    const credentials = parseAuthHeader(req.headers.authorization);

    if (
      credentials?.name !== api_documentation_credentials.name ||
      credentials?.pass !== api_documentation_credentials.pass
    ) {
      return unauthorizedResponse();
    }

    next();
  });
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'HUST Data gen hub API',
  });

  return app;
}
