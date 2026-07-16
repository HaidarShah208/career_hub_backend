import 'reflect-metadata';
import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { env } from './env';
import { User } from '../modules/users/user.entity';
import { Company } from '../modules/companies/company.entity';
import { Job } from '../modules/jobs/job.entity';
import { JobCategory } from '../modules/jobs/job-category.entity';
import { Application } from '../modules/applications/application.entity';
import { ApplicationStatusHistory } from '../modules/applications/application-status-history.entity';
import { CandidateProfile } from '../modules/candidates/candidate-profile.entity';
import { Plan } from '../modules/billing/plan.entity';
import { Subscription } from '../modules/billing/subscription.entity';
import { Payment } from '../modules/billing/payment.entity';

const entities = [
  User,
  Company,
  Job,
  JobCategory,
  Application,
  ApplicationStatusHistory,
  CandidateProfile,
  Plan,
  Subscription,
  Payment,
];

const sharedOptions: Pick<DataSourceOptions, 'entities' | 'migrations' | 'subscribers' | 'synchronize' | 'logging'> = {
  entities,
  migrations: [path.join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
  subscribers: [],
  synchronize: env.DB_SYNCHRONIZE,
  logging: env.DB_LOGGING,
};

const connectionOptions: DataSourceOptions = env.DATABASE_URL
  ? {
      type: 'postgres',
      url: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      ...sharedOptions,
    }
  : {
      type: 'postgres',
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      username: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      database: env.DATABASE_NAME,
      ...sharedOptions,
    };

/**
 * The single TypeORM DataSource for the whole application.
 *
 * Entities are registered explicitly (rather than via glob) so the same
 * configuration works identically under ts-node (dev / migrations) and after
 * compilation to `dist`. Migrations use a {ts,js} glob so both runtimes resolve.
 */
export const AppDataSource = new DataSource(connectionOptions);
