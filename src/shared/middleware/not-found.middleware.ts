import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors';

/** Catch-all for unmatched routes. */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}
