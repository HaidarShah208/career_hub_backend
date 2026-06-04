import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../constants';
import { ForbiddenError, UnauthorizedError } from '../errors';

/**
 * Role-based access control. Must run after `authenticate`.
 *
 *   router.get('/dashboard', authenticate, authorize(UserRole.ADMIN), handler)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('You do not have permission to access this resource');
    }
    next();
  };
}

/** Convenience guard for admin-only routes. */
export const adminOnly = authorize(UserRole.ADMIN);
