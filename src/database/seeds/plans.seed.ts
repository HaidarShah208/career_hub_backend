import { DataSource } from 'typeorm';
import { BillingCycle } from '../../shared/constants';
import { Plan } from '../../modules/billing/plan.entity';
import { logger } from '../../shared/logger';

const DEFAULT_PLANS: Array<Partial<Plan> & { slug: string }> = [
  {
    name: 'Starter',
    slug: 'starter',
    description: 'For small teams getting started with hiring.',
    price: 5000,
    currency: 'PKR',
    billingCycle: BillingCycle.MONTHLY,
    jobLimit: 5,
    applicationLimit: 100,
    featuredJobsLimit: 0,
    recruiterSeats: 1,
    resumeViews: 50,
    prioritySupport: false,
    isPopular: false,
    isActive: true,
  },
  {
    name: 'Professional',
    slug: 'professional',
    description: 'Growing companies with higher hiring volume.',
    price: 15000,
    currency: 'PKR',
    billingCycle: BillingCycle.MONTHLY,
    jobLimit: 25,
    applicationLimit: null,
    featuredJobsLimit: 5,
    recruiterSeats: 5,
    resumeViews: 500,
    prioritySupport: false,
    isPopular: true,
    isActive: true,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Unlimited hiring power for large organisations.',
    price: 50000,
    currency: 'PKR',
    billingCycle: BillingCycle.MONTHLY,
    jobLimit: null,
    applicationLimit: null,
    featuredJobsLimit: null,
    recruiterSeats: null,
    resumeViews: null,
    prioritySupport: true,
    isPopular: false,
    isActive: true,
  },
];

/** Idempotent plan seeder — upserts by slug. */
export async function seedPlans(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Plan);

  for (const plan of DEFAULT_PLANS) {
    const existing = await repo.findOne({ where: { slug: plan.slug } });
    if (existing) {
      Object.assign(existing, plan);
      await repo.save(existing);
      logger.info(`Plan updated: ${plan.slug}`);
    } else {
      await repo.save(repo.create(plan));
      logger.info(`Plan created: ${plan.slug}`);
    }
  }
}
