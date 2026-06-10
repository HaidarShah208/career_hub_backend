import { EmployerStatus, JobStatus, SubscriptionStatus } from '../../shared/constants';
import { ForbiddenError, PaymentRequiredError } from '../../shared/errors';
import { applicationsRepository } from '../applications/applications.repository';
import { Company } from '../companies/company.entity';
import { jobsRepository } from '../jobs/jobs.repository';
import { Job } from '../jobs/job.entity';
import { Plan } from './plan.entity';
import { subscriptionsRepository } from './subscriptions.repository';

function isUnlimited(limit?: number | null): boolean {
  return limit === null || limit === undefined;
}

export class BillingEnforcementService {
  async getActiveSubscription(employerId: string) {
    return subscriptionsRepository.findActiveByEmployerId(employerId);
  }

  async assertEmployerApproved(company: Company): Promise<void> {
    if (company.employerStatus !== EmployerStatus.APPROVED) {
      throw new ForbiddenError(
        'Your company must be approved by admin before you can publish jobs or purchase a plan.',
      );
    }
  }

  async assertCanPurchase(company: Company): Promise<void> {
    if (company.employerStatus === EmployerStatus.SUSPENDED) {
      throw new ForbiddenError('Your employer account is suspended.');
    }
    if (company.employerStatus !== EmployerStatus.APPROVED) {
      throw new ForbiddenError('Only approved employers can purchase subscriptions.');
    }
  }

  async assertCanPublishJob(
    employerId: string,
    company: Company,
    job?: Partial<Job>,
  ): Promise<void> {
    await this.assertEmployerApproved(company);

    const subscription = await subscriptionsRepository.findActiveByEmployerId(employerId);
    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new PaymentRequiredError(
        'An active subscription is required to publish jobs. Please purchase a plan.',
      );
    }

    const plan = subscription.plan;
    if (!plan) return;

    const activeJobs = await jobsRepository.countByCompanyAndStatus(company.id, JobStatus.PUBLISHED);
    const publishingNew =
      !job?.id || (await jobsRepository.findById(job.id))?.status !== JobStatus.PUBLISHED;

    if (publishingNew && !isUnlimited(plan.jobLimit) && activeJobs >= (plan.jobLimit ?? 0)) {
      throw new ForbiddenError(
        'You have reached your plan limit. Please upgrade your subscription.',
      );
    }

    if (job?.isFeatured && !isUnlimited(plan.featuredJobsLimit)) {
      const featuredCount = await this.countFeaturedPublished(company.id);
      if (featuredCount >= (plan.featuredJobsLimit ?? 0)) {
        throw new ForbiddenError('Featured job limit reached for your plan. Upgrade to add more.');
      }
    }
  }

  private async countFeaturedPublished(companyId: string): Promise<number> {
    const jobs = await jobsRepository.findByCompanyId(companyId);
    return jobs.filter((j) => j.status === JobStatus.PUBLISHED && j.isFeatured).length;
  }

  async getUsage(employerId: string, companyId: string, plan: Plan) {
    const activeJobs = await jobsRepository.countByCompanyAndStatus(companyId, JobStatus.PUBLISHED);
    const featuredJobs = await this.countFeaturedPublished(companyId);
    const applicationsUsed = await applicationsRepository.countByCompany(companyId);

    return {
      jobsUsed: activeJobs,
      jobsRemaining: isUnlimited(plan.jobLimit) ? null : Math.max(0, (plan.jobLimit ?? 0) - activeJobs),
      applicationsUsed,
      applicationsRemaining: isUnlimited(plan.applicationLimit)
        ? null
        : Math.max(0, (plan.applicationLimit ?? 0) - applicationsUsed),
      featuredJobsUsed: featuredJobs,
      featuredJobsRemaining: isUnlimited(plan.featuredJobsLimit)
        ? null
        : Math.max(0, (plan.featuredJobsLimit ?? 0) - featuredJobs),
      resumeViewsUsed: 0,
      resumeViewsRemaining: plan.resumeViews ?? null,
    };
  }
}

export const billingEnforcementService = new BillingEnforcementService();
