import { z } from 'zod';
import { BillingCycle, PaymentMethod } from '../../shared/constants';
import { idParamSchema } from '../../shared/validators/common';

export const createManualPaymentSchema = z.object({
  body: z.object({
    planId: z.string().uuid(),
    paymentMethod: z.enum([
      PaymentMethod.EASYPAISA,
      PaymentMethod.JAZZCASH,
      PaymentMethod.BANK_TRANSFER,
    ]),
    transactionReference: z.string().min(3).max(255),
    screenshotUrl: z.string().url().optional(),
  }),
});

export const stripeCheckoutSchema = z.object({
  body: z.object({
    planId: z.string().uuid(),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
  }),
});

export const planIdBodySchema = z.object({
  body: z.object({
    planId: z.string().uuid(),
  }),
});

export const verifyPaymentSchema = idParamSchema.extend({
  body: z.object({
    approved: z.boolean(),
  }),
});

export const adminPlanSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
    description: z.string().max(2000).optional(),
    price: z.number().int().min(0),
    currency: z.string().length(3).default('PKR'),
    billingCycle: z.nativeEnum(BillingCycle).default(BillingCycle.MONTHLY),
    jobLimit: z.number().int().min(0).nullable().optional(),
    applicationLimit: z.number().int().min(0).nullable().optional(),
    featuredJobsLimit: z.number().int().min(0).nullable().optional(),
    recruiterSeats: z.number().int().min(0).nullable().optional(),
    resumeViews: z.number().int().min(0).nullable().optional(),
    prioritySupport: z.boolean().optional(),
    isPopular: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const adminUpdatePlanSchema = idParamSchema.extend({
  body: adminPlanSchema.shape.body.partial(),
});

export const listPaymentsQuerySchema = z.object({
  query: z.object({
    status: z.string().optional(),
  }),
});
