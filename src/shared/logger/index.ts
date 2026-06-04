import fs from 'fs';
import path from 'path';
import { createLogger, format, transports, Logger } from 'winston';
import { env, isProduction } from '../../config/env';

const logDir = path.resolve(process.cwd(), 'logs');

// Ensure the logs directory exists before file transports attach to it.
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch {
  // If we cannot create the directory we silently fall back to console only.
}

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
  }),
);

const fileFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json(),
);

export const logger: Logger = createLogger({
  level: isProduction ? 'info' : 'debug',
  defaultMeta: { service: 'career-hub-api' },
  transports: [
    new transports.Console({ format: consoleFormat }),
  ],
  exitOnError: false,
});

// Add persistent file logging when a writable logs directory is available.
try {
  if (fs.existsSync(logDir)) {
    logger.add(
      new transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
      }),
    );
    logger.add(
      new transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: fileFormat,
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
      }),
    );
  }
} catch {
  // Keep console-only logging on failure.
}

logger.debug(`Logger initialised (NODE_ENV=${env.NODE_ENV})`);

export default logger;
