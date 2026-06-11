import {
  BillingCycle,
  EmployerStatus,
  PaymentMethod,
  PaymentStatus,
  SubscriptionStatus,
} from '../../shared/constants';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  PaymentRequiredError,
} from '../../shared/errors';
import { notificationService } from '../../shared/services/notification.service';
import { companiesRepository } from '../companies/companies.repository';
import { employerCompanyService } from '../employers/employer-company.service';
import { billingEnforcementService } from './billing-enforcement.service';
import { Payment } from './payment.entity';
import { paymentsRepository } from './payments.repository';
import { Plan } from './plan.entity';
import { plansRepository } from './plans.repository';
import { Subscription } from './subscription.entity';
import { subscriptionsRepository } from './subscriptions.repository';

function addBillingPeriod(from: Date, cycle: BillingCycle): Date {
  const end = new Date(from);
  if (cycle === BillingCycle.YEARLY) {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

export class BillingService {
  async listPublicPlans() {
    return plansRepository.findAllActive();
  }

  async getEmployerOverview(employerId: string) {
    const company = await employerCompanyService.getMyCompany(employerId);
    const subscription = await subscriptionsRepository.findLatestByEmployerId(employerId);
    const plan = subscription?.plan ?? null;
    const usage =
      subscription?.status === SubscriptionStatus.ACTIVE && plan
        ? await billingEnforcementService.getUsage(employerId, company.id, plan)
        : null;

    return {
      company: {
        id: company.id,
        name: company.name,
        employerStatus: company.employerStatus,
        isVerified: company.employerStatus === EmployerStatus.APPROVED,
        verificationDocuments: company.verificationDocuments ?? [],
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            autoRenew: subscription.autoRenew,
            pendingPlanId: subscription.pendingPlanId,
            plan: plan
              ? {
                  id: plan.id,
                  name: plan.name,
                  slug: plan.slug,
                  price: plan.price,
                  currency: plan.currency,
                  billingCycle: plan.billingCycle,
                  jobLimit: plan.jobLimit,
                  applicationLimit: plan.applicationLimit,
                  featuredJobsLimit: plan.featuredJobsLimit,
                  recruiterSeats: plan.recruiterSeats,
                  resumeViews: plan.resumeViews,
                  prioritySupport: plan.prioritySupport,
                }
              : null,
          }
        : null,
      usage,
      paymentInstructions: this.getManualPaymentInstructions(),
    };
  }

  getManualPaymentInstructions() {
    return {
      easypaisa: process.env.EASYPAISA_ACCOUNT ?? '03001234567',
      jazzcash: process.env.JAZZCASH_ACCOUNT ?? '03001234567',
      bank: {
        accountTitle: process.env.BANK_ACCOUNT_TITLE ?? 'Pakistan Career Hub Pvt Ltd',
        bankName: process.env.BANK_NAME ?? 'HBL',
        iban: process.env.BANK_IBAN ?? 'PK00HABB0000000000000000',
        accountNumber: process.env.BANK_ACCOUNT_NUMBER ?? '000000000000',
      },
    };
  }

  async activateFreePlan(employerId: string): Promise<Subscription> {
    const company = await employerCompanyService.getMyCompany(employerId);
    await billingEnforcementService.assertCanPurchase(company);

    const plan = await plansRepository.findBySlug('free');
    if (!plan || !plan.isActive) throw new NotFoundError('Free plan is not available');

    const active = await subscriptionsRepository.findActiveByEmployerId(employerId);
    if (active) {
      throw new BadRequestError('You already have an active subscription');
    }

    const subscription = subscriptionsRepository.create({
      employerId,
      planId: plan.id,
      status: SubscriptionStatus.PENDING_PAYMENT,
    });
    const saved = await subscriptionsRepository.save(subscription);
    return this.activateSubscription(saved.id, employerId);
  }

  /** Assigns the free plan when an employer is approved and has no subscription yet. */
  async provisionFreePlanIfNeeded(employerId: string): Promise<void> {
    const active = await subscriptionsRepository.findActiveByEmployerId(employerId);
    if (active) return;

    const latest = await subscriptionsRepository.findLatestByEmployerId(employerId);
    if (latest?.status === SubscriptionStatus.PENDING_PAYMENT) return;

    const plan = await plansRepository.findBySlug('free');
    if (!plan?.isActive) return;

    const subscription = subscriptionsRepository.create({
      employerId,
      planId: plan.id,
      status: SubscriptionStatus.PENDING_PAYMENT,
    });
    const saved = await subscriptionsRepository.save(subscription);
    await this.activateSubscription(saved.id, employerId);
  }

  async createManualPayment(
    employerId: string,
    input: {
      planId: string;
      paymentMethod: PaymentMethod;
      transactionReference: string;
      screenshotUrl?: string;
    },
  ) {
    const company = await employerCompanyService.getMyCompany(employerId);
    await billingEnforcementService.assertCanPurchase(company);

    const plan = await plansRepository.findById(input.planId);
    if (!plan || !plan.isActive) throw new NotFoundError('Plan not found');

    if (plan.price <= 0) {
      throw new BadRequestError('This plan is free. Activate it without payment.');
    }

    if (![PaymentMethod.EASYPAISA, PaymentMethod.JAZZCASH, PaymentMethod.BANK_TRANSFER].includes(
      input.paymentMethod,
    )) {
      throw new BadRequestError('Invalid manual payment method');
    }

    const subscription = subscriptionsRepository.create({
      employerId,
      planId: plan.id,
      status: SubscriptionStatus.PENDING_PAYMENT,
    });
    const savedSub = await subscriptionsRepository.save(subscription);

    const payment = paymentsRepository.create({
      employerId,
      subscriptionId: savedSub.id,
      planId: plan.id,
      amount: plan.price,
      currency: plan.currency,
      paymentMethod: input.paymentMethod,
      transactionReference: input.transactionReference,
      screenshotUrl: input.screenshotUrl ?? null,
      status: PaymentStatus.PENDING,
    });
    const savedPayment = await paymentsRepository.save(payment);

    return { subscription: savedSub, payment: savedPayment };
  }

  async verifyManualPayment(paymentId: string, adminId: string, approved: boolean) {
    const payment = await paymentsRepository.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestError('Payment is not pending verification');
    }

    if (!approved) {
      payment.status = PaymentStatus.FAILED;
      payment.verifiedBy = adminId;
      payment.verificationDate = new Date();
      await paymentsRepository.save(payment);
      if (payment.subscriptionId) {
        const sub = await subscriptionsRepository.findById(payment.subscriptionId);
        if (sub) {
          sub.status = SubscriptionStatus.CANCELLED;
          await subscriptionsRepository.save(sub);
        }
      }
      if (payment.employer?.email) {
        await notificationService.send({
          to: payment.employer.email,
          type: 'PAYMENT_FAILED',
          subject: 'Payment verification failed',
          body: 'Your manual payment could not be verified. Please contact support.',
        });
      }
      return payment;
    }

    payment.status = PaymentStatus.SUCCESS;
    payment.paidAt = new Date();
    payment.verifiedBy = adminId;
    payment.verificationDate = new Date();
    await paymentsRepository.save(payment);

    if (payment.subscriptionId) {
      await this.activateSubscription(payment.subscriptionId, payment.employerId);
    }

    return payment;
  }

  async activateSubscription(subscriptionId: string, employerId: string) {
    const subscription = await subscriptionsRepository.findById(subscriptionId);
    if (!subscription || subscription.employerId !== employerId) {
      throw new NotFoundError('Subscription not found');
    }

    const plan = subscription.plan ?? (await plansRepository.findById(subscription.planId));
    if (!plan) throw new NotFoundError('Plan not found');

    const now = new Date();
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.startDate = now;
    subscription.endDate = plan.price <= 0 ? null : addBillingPeriod(now, plan.billingCycle);
    subscription.pendingPlanId = null;
    await subscriptionsRepository.save(subscription);

    const employer = subscription.employer;
    if (employer?.email) {
      await notificationService.send({
        to: employer.email,
        type: 'SUBSCRIPTION_ACTIVATED',
        subject: `Subscription activated — ${plan.name}`,
        body: `Your ${plan.name} plan is active until ${subscription.endDate?.toISOString()}.`,
      });
    }

    return subscription;
  }

  async scheduleDowngrade(employerId: string, planId: string) {
    const subscription = await subscriptionsRepository.findActiveByEmployerId(employerId);
    if (!subscription) throw new PaymentRequiredError('No active subscription');

    const newPlan = await plansRepository.findById(planId);
    if (!newPlan || !newPlan.isActive) throw new NotFoundError('Plan not found');

    subscription.pendingPlanId = newPlan.id;
    await subscriptionsRepository.save(subscription);

    if (subscription.employer?.email) {
      await notificationService.send({
        to: subscription.employer.email,
        type: 'PLAN_DOWNGRADE',
        subject: 'Plan downgrade scheduled',
        body: `Your plan will change to ${newPlan.name} on renewal.`,
      });
    }

    return subscription;
  }

  async requestUpgrade(employerId: string, planId: string) {
    const company = await employerCompanyService.getMyCompany(employerId);
    await billingEnforcementService.assertCanPurchase(company);

    const current = await subscriptionsRepository.findActiveByEmployerId(employerId);
    const newPlan = await plansRepository.findById(planId);
    if (!newPlan || !newPlan.isActive) throw new NotFoundError('Plan not found');

    let amount = newPlan.price;
    if (current?.plan && current.endDate && current.startDate) {
      const totalMs = current.endDate.getTime() - current.startDate.getTime();
      const remainingMs = Math.max(0, current.endDate.getTime() - Date.now());
      const ratio = totalMs > 0 ? remainingMs / totalMs : 0;
      const credit = Math.floor((current.plan.price ?? 0) * ratio);
      amount = Math.max(0, newPlan.price - credit);
    }

    const subscription = subscriptionsRepository.create({
      employerId,
      planId: newPlan.id,
      status: SubscriptionStatus.PENDING_PAYMENT,
    });
    const savedSub = await subscriptionsRepository.save(subscription);

    return { subscription: savedSub, proratedAmount: amount, plan: newPlan };
  }

  async expireDueSubscriptions(): Promise<number> {
    const due = await subscriptionsRepository.findExpiredCandidates(new Date());
    for (const sub of due) {
      if (sub.pendingPlanId) {
        sub.planId = sub.pendingPlanId;
        sub.pendingPlanId = null;
        const plan = await plansRepository.findById(sub.planId);
        const now = new Date();
        sub.startDate = now;
        sub.endDate = plan ? addBillingPeriod(now, plan.billingCycle) : null;
        sub.status = SubscriptionStatus.ACTIVE;
      } else {
        sub.status = SubscriptionStatus.EXPIRED;
        if (sub.employer?.email) {
          await notificationService.send({
            to: sub.employer.email,
            type: 'SUBSCRIPTION_EXPIRED',
            subject: 'Subscription expired',
            body: 'Your subscription has expired. Renew to continue posting jobs.',
          });
        }
      }
      await subscriptionsRepository.save(sub);
    }
    return due.length;
  }

  // ---- Admin plan management ----

  async adminListPlans() {
    return plansRepository.findAll();
  }

  async adminCreatePlan(dto: Partial<Plan>) {
    if (!dto.name || !dto.slug || dto.price === undefined) {
      throw new BadRequestError('name, slug, and price are required');
    }
    const existing = await plansRepository.findBySlug(dto.slug);
    if (existing) throw new BadRequestError('Plan slug already exists');
    const plan = plansRepository.create(dto);
    return plansRepository.save(plan);
  }

  async adminUpdatePlan(id: string, dto: Partial<Plan>) {
    const plan = await plansRepository.findById(id);
    if (!plan) throw new NotFoundError('Plan not found');
    Object.assign(plan, dto);
    return plansRepository.save(plan);
  }

  async adminDeletePlan(id: string) {
    const plan = await plansRepository.findById(id);
    if (!plan) throw new NotFoundError('Plan not found');
    plan.isActive = false;
    return plansRepository.save(plan);
  }

  async adminListSubscriptions() {
    return subscriptionsRepository.findAllWithPlan();
  }

  async adminListPayments(status?: PaymentStatus) {
    if (status === PaymentStatus.PENDING) {
      return paymentsRepository.findPendingVerification();
    }
    return paymentsRepository.findAllRecent(100);
  }
}

export const billingService = new BillingService();
