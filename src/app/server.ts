import 'reflect-metadata';
import http from 'http';
import { createApp } from './app';
import { env } from '../config/env';
import { AppDataSource } from '../config/database';
import { connectRedis, disconnectRedis } from '../config/redis';
import { logger } from '../shared/logger';

async function bootstrap(): Promise<void> {
  // 1. Database
  await AppDataSource.initialize();
  logger.info(`Database connected (${env.DATABASE_NAME}@${env.DATABASE_HOST}:${env.DATABASE_PORT})`);

  // 2. Cache (best-effort)
  await connectRedis();

  // 3. HTTP server
  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`🚀 Server listening on http://localhost:${env.PORT}`);
    logger.info(`📚 API docs available at http://localhost:${env.PORT}/api-docs`);
    logger.info(`🔌 API base path: ${env.API_PREFIX}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      try {
        await disconnectRedis();
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
        }
        logger.info('Shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error(`Error during shutdown: ${(err as Error).message}`);
        process.exit(1);
      }
    });

    // Force exit if cleanup hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error(`Failed to start server: ${(err as Error).message}`, { stack: (err as Error).stack });
  process.exit(1);
});
