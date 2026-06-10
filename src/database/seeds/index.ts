import 'reflect-metadata';
import { AppDataSource } from '../../config/database';
import { logger } from '../../shared/logger';
import { seedAdmin } from './admin.seed';
import { seedPlans } from './plans.seed';

/**
 * Seed runner. Initialises the DataSource, executes all seeders in order,
 * then tears the connection down. Safe to run repeatedly.
 */
async function runSeeds(): Promise<void> {
  await AppDataSource.initialize();
  logger.info('Database connected for seeding');

  try {
    await seedAdmin(AppDataSource);
    await seedPlans(AppDataSource);
    logger.info('Seeding complete');
  } finally {
    await AppDataSource.destroy();
  }
}

runSeeds()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(`Seeding failed: ${(err as Error).message}`, { stack: (err as Error).stack });
    process.exit(1);
  });
