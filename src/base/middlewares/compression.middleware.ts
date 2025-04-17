import { NestMiddleware } from '@nestjs/common';
import * as compression from 'compression';
import { NextFunction, Request, Response } from 'express';

export class CompressionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    compression({
      // filter: (req) => req.query['compressed'] === 'true' || req.body['compressed'] === true,
      threshold: 0,
    })(req, res, next);
  }
}
