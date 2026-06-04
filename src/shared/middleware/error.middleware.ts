import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { QueryFailedError } from 'typeorm';
import { ZodError } from 'zod';
import { AppError } from '../errors';
import { logger } from '../logger';
import { sendError } from '../utils/api-response';
import { isProduction } from '../../config/env';

interface PostgresError extends QueryFailedError {
  code?: string;
  detail?: string;
}

/**
 * Centralised error handler. Every error in the app funnels through here and
 * is serialised into the standard error envelope.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // `next` must be present so Express recognises this as an error handler.
  _next: NextFunction,
): Response {
  // Known, operational application errors.
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`, { stack: err.stack });
    }
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // File-upload errors raised by multer (size limit, unexpected field, etc.).
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Unexpected file field. Use the "file" field for uploads.'
          : 'File upload failed';
    return sendError(res, message, 400, [{ message: err.message }]);
  }

  // Zod errors that slipped past the validate middleware.
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(res, 'Validation failed', 422, details);
  }

  // Database-level errors (unique violations, etc.).
  if (err instanceof QueryFailedError) {
    const pgErr = err as PostgresError;
    if (pgErr.code === '23505') {
      return sendError(res, 'A record with the same unique value already exists', 409, [
        { message: pgErr.detail ?? 'Duplicate value' },
      ]);
    }
    if (pgErr.code === '23503') {
      return sendError(res, 'Related record not found', 400, [
        { message: pgErr.detail ?? 'Foreign key violation' },
      ]);
    }
    logger.error(`Database error on ${req.method} ${req.originalUrl}`, {
      code: pgErr.code,
      message: pgErr.message,
    });
    return sendError(res, 'A database error occurred', 500);
  }

  // Anything else is unexpected -> log full detail, return generic 500.
  const message = err instanceof Error ? err.message : 'Unknown error';
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}: ${message}`, { stack });

  return sendError(res, isProduction ? 'Internal server error' : message, 500);
}
