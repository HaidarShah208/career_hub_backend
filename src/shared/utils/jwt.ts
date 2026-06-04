import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { UserRole } from '../constants';
import { UnauthorizedError } from '../errors';

export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
}

type TokenKind = 'access' | 'refresh';

function secretFor(kind: TokenKind): string {
  return kind === 'access' ? env.JWT_SECRET : env.JWT_REFRESH_SECRET;
}

function expiresFor(kind: TokenKind): string {
  return kind === 'access' ? env.JWT_ACCESS_EXPIRES_IN : env.JWT_REFRESH_EXPIRES_IN;
}

function sign(payload: TokenPayload, kind: TokenKind): string {
  const options: SignOptions = { expiresIn: expiresFor(kind) as SignOptions['expiresIn'] };
  return jwt.sign(payload, secretFor(kind), options);
}

export function signAccessToken(payload: TokenPayload): string {
  return sign(payload, 'access');
}

export function signRefreshToken(payload: TokenPayload): string {
  return sign(payload, 'refresh');
}

export function signTokenPair(payload: TokenPayload): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

function verify(token: string, kind: TokenKind): TokenPayload {
  try {
    const decoded = jwt.verify(token, secretFor(kind)) as JwtPayload & TokenPayload;
    return { sub: decoded.sub as string, email: decoded.email, role: decoded.role };
  } catch {
    throw new UnauthorizedError(
      kind === 'access' ? 'Invalid or expired access token' : 'Invalid or expired refresh token',
    );
  }
}

export function verifyAccessToken(token: string): TokenPayload {
  return verify(token, 'access');
}

export function verifyRefreshToken(token: string): TokenPayload {
  return verify(token, 'refresh');
}
