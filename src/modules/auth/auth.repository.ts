import { cache } from '../../config/redis';
import { redisClient } from '../../config/redis';
import { usersRepository, UsersRepository } from '../users/users.repository';
import { User } from '../users/user.entity';

const REFRESH_PREFIX = 'auth:refresh:';
// Keep stored refresh tokens around for 7 days (matches JWT_REFRESH_EXPIRES_IN default).
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * Auth-specific persistence: user lookups for credentials plus refresh-token
 * tracking in Redis (best-effort, enables logout / token revocation).
 */
export class AuthRepository {
  constructor(private readonly users: UsersRepository = usersRepository) {}

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users.findByEmailWithPassword(email);
  }

  findById(id: string): Promise<User | null> {
    return this.users.findById(id);
  }

  async storeRefreshToken(userId: string, token: string): Promise<void> {
    await cache.set(`${REFRESH_PREFIX}${userId}`, token, REFRESH_TTL_SECONDS);
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return cache.get<string>(`${REFRESH_PREFIX}${userId}`);
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await cache.del(`${REFRESH_PREFIX}${userId}`);
  }

  /** Whether Redis is reachable (used to decide if token revocation is enforced). */
  isTokenStoreReady(): boolean {
    return redisClient.status === 'ready';
  }
}

export const authRepository = new AuthRepository();
