import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

/**
 * Log middleware runs on every HTTP request.
 */
@Injectable()
export class LogsMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startAt = process.hrtime();

    response.on('close', () => {
      const { ip, method, originalUrl } = request;
      const { statusCode, statusMessage } = response;

      const userAgent = request.get('user-agent') || '';
      const diff = process.hrtime(startAt);
      const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
      const LOGGING_FILE_MODE = (process.env.LOGGING_FILE_MODE || 'false') === 'true';

      const message = LOGGING_FILE_MODE
        ? `${method}::${originalUrl}::${statusCode}::${statusMessage}::${responseTime}::${userAgent}::${ip}`
        : `${method} ${originalUrl} ${statusCode} ${statusMessage} ${responseTime}ms - ${userAgent} ${ip}`;

      if (statusCode >= 500) {
        return this.logger.error(message);
      }
      if (statusCode >= 400) {
        return this.logger.warn(message);
      }
      this.logger.log(message);
    });
    next();
  }
}