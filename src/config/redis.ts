import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../shared/logger';

/**
 * Redis client + small caching helper.
 *
 * Caching is treated as a best-effort optimisation: if Redis is unavailable
 * the helpers fail soft (log a warning and behave as a cache miss) so the API
 * keeps serving requests straight from PostgreSQL.
 */
export const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

let redisAvailable = false;

redisClient.on('connect', () => {
  redisAvailable = true;
  logger.info('Redis connected');
});

redisClient.on('error', (err) => {
  if (redisAvailable) {
    logger.warn(`Redis connection error: ${err.message}`);
  }
  redisAvailable = false;
});

redisClient.on('end', () => {
  redisAvailable = false;
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (err) {
    redisAvailable = false;
    logger.warn(
      `Could not connect to Redis at ${env.REDIS_HOST}:${env.REDIS_PORT} - continuing without cache`,
    );
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redisClient.quit();
  } catch {
    redisClient.disconnect();
  }
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redisAvailable) return null;
    try {
      const raw = await redisClient.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      logger.warn(`Cache get failed for "${key}": ${(err as Error).message}`);
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!redisAvailable) return;
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      logger.warn(`Cache set failed for "${key}": ${(err as Error).message}`);
    }
  },

  async del(...keys: string[]): Promise<void> {
    if (!redisAvailable || keys.length === 0) return;
    try {
      await redisClient.del(...keys);
    } catch (err) {
      logger.warn(`Cache delete failed: ${(err as Error).message}`);
    }
  },
};
