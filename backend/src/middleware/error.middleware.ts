import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'An unexpected internal error occurred';
  let code = 'INTERNAL_SERVER_ERROR';
  let details: any = undefined;

  // 1. AppError (our trusted operational errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  }
  // 2. Zod Validation Error
  else if (err instanceof ZodError) {
    statusCode = 422;
    message = 'Validation failed for request parameters';
    code = 'VALIDATION_ERROR';
    details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
  // 3. Prisma Known Request Errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'A resource with this unique identifier already exists.';
      code = 'CONFLICT';
      details = err.meta;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Requested record was not found.';
      code = 'NOT_FOUND';
    } else {
      statusCode = 400;
      message = `Database query error: ${err.message}`;
      code = 'BAD_REQUEST';
    }
  }
  // 4. JWT Verification Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'UNAUTHORIZED';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    code = 'UNAUTHORIZED';
  }
  // 5. SyntaxError (Invalid JSON payload)
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload in request body';
    code = 'BAD_REQUEST';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - Internal Server Error: ${err.message}`, {
      stack: err.stack,
      body: req.body,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${statusCode} ${code}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(details ? { details } : {}),
    ...(env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};
