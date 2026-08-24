import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const message = `${req.method} ${req.originalUrl} ${status} - ${duration}ms`;

    if (status >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });

  next();
};
