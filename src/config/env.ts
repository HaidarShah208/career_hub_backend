import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load variables from the project-root .env file regardless of cwd.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Centralised, validated environment configuration.
 *
 * Every part of the application reads configuration from here instead of
 * touching `process.env` directly. Invalid configuration fails fast on boot.
 */
const booleanFromString = z
  .union([z.boolean(), z.string()])
  .transform((value) => value === true || value === 'true' || value === '1');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('*'),

  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default('postgres'),
  DATABASE_NAME: z.string().default('career_hub'),
  DB_SYNCHRONIZE: booleanFromString.default(false),
  DB_LOGGING: booleanFromString.default(false),

  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(10, 'JWT_REFRESH_SECRET must be at least 10 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  ADMIN_EMAIL: z.string().email().default('admin@careerhub.pk'),
  ADMIN_PASSWORD: z.string().default('Admin@123'),
  ADMIN_FIRST_NAME: z.string().default('System'),
  ADMIN_LAST_NAME: z.string().default('Administrator'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),

  // Cloudinary (file uploads). Optional: when unset, upload endpoints return a
  // clear "not configured" error instead of crashing the app on boot.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  // Use console here: the logger itself may depend on a valid environment.
  // eslint-disable-next-line no-console
  console.error(`\n[env] Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

export type Env = typeof env;
