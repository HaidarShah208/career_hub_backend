import { UserRole } from '../../constants';

/**
 * Augments Express' Request type with the authenticated user that the
 * auth middleware attaches after verifying a JWT.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export {};
