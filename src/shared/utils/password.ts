import bcrypt from 'bcryptjs';
import { env } from '../../config/env';

/**
 * Password hashing helpers.
 *
 * We use `bcryptjs` (a pure-JS, drop-in compatible implementation of bcrypt)
 * so the project installs cleanly on every platform without native build
 * tooling. The hashing algorithm and output format are identical to `bcrypt`.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
