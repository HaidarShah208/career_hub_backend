import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../errors';

/**
 * Validates `req.body`, `req.query` and `req.params` against a Zod schema.
 *
 * The schema is expected to have any of the keys `body`, `query`, `params`.
 * Parsed/transformed values are written back so downstream handlers receive
 * coerced, trustworthy data.
 */
export const validate =
  (schema: AnyZodObject) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (result.body !== undefined) req.body = result.body;
      // req.query / req.params have read-only typings but are writable at runtime.
      if (result.query !== undefined) Object.assign(req.query, result.query);
      if (result.params !== undefined) Object.assign(req.params, result.params);

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.'),
          message: issue.message,
        }));
        next(new ValidationError('Validation failed', details));
        return;
      }
      next(error);
    }
  };
