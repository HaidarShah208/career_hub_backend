import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Authentication middleware.
 *
 * 1. Reads the Bearer token from the Authorization header.
 * 2. Verifies the JWT access token.
 * 3. Attaches the decoded principal to `req.user`.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token is missing');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new UnauthorizedError('Authentication token is missing');
  }

  const payload = verifyAccessToken(token);
  req.user = { id: payload.sub, email: payload.email, role: payload.role };
  next();
}
