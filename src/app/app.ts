import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from '../config/env';
import { setupSwagger } from '../config/swagger';
import { errorHandler, notFound, requestLogger } from '../shared/middleware';
import apiRoutes from './routes';

/** Builds and configures the Express application (no network side-effects). */
export function createApp(): Application {
  const app = express();

  // Trust the first proxy hop (needed for correct IPs behind nginx/load balancers).
  app.set('trust proxy', 1);

  // Security & parsing middleware.
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // API documentation.
  setupSwagger(app);

  // Root + API routes.
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Pakistan Career Hub API',
      data: { version: '1.0.0', docs: '/api-docs', api: env.API_PREFIX },
    });
  });

  app.use(env.API_PREFIX, apiRoutes);

  // 404 + centralised error handling (must be registered last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
