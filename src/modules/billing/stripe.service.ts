import Stripe from 'stripe';
import { PaymentMethod, PaymentStatus, SubscriptionStatus } from '../../shared/constants';
import { BadRequestError } from '../../shared/errors';
import { logger } from '../../shared/logger';
import { billingService } from './billing.service';
import { paymentsRepository } from './payments.repository';
import { plansRepository } from './plans.repository';
import { subscriptionsRepository } from './subscriptions.repository';

type StripeClient = InstanceType<typeof Stripe>;

interface CheckoutSessionPayload {
  id: string;
  metadata?: Record<string, string> | null;
  payment_intent?: string | { id: string } | null;
}

function getStripe(): StripeClient | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export class StripeBillingService {
  isConfigured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }

  async createCheckoutSession(
    employerId: string,
    employerEmail: string,
    planId: string,
    successUrl: string,
    cancelUrl: string,
    amountOverride?: number,
  ) {
    const stripe = getStripe();
    if (!stripe) throw new BadRequestError('Stripe is not configured');

    const plan = await plansRepository.findById(planId);
    if (!plan || !plan.isActive) throw new BadRequestError('Plan not found');
    if (plan.price <= 0) {
      throw new BadRequestError('Free plans cannot be purchased via Stripe');
    }

    const subscription = subscriptionsRepository.create({
      employerId,
      planId: plan.id,
      status: SubscriptionStatus.PENDING_PAYMENT,
    });
    const savedSub = await subscriptionsRepository.save(subscription);

    const amount = amountOverride ?? plan.price;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: employerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            unit_amount: amount * 100,
            product_data: {
              name: `${plan.name} Plan`,
              description: plan.description ?? undefined,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        employerId,
        subscriptionId: savedSub.id,
        planId: plan.id,
      },
    });

    const payment = paymentsRepository.create({
      employerId,
      subscriptionId: savedSub.id,
      planId: plan.id,
      amount,
      currency: plan.currency,
      paymentMethod: PaymentMethod.STRIPE,
      gatewayTransactionId: session.id,
      status: PaymentStatus.PROCESSING,
    });
    await paymentsRepository.save(payment);

    return { url: session.url, sessionId: session.id };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) {
      throw new BadRequestError('Stripe webhook not configured');
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as CheckoutSessionPayload;
        await this.completeCheckout(session);
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as { id: string };
        logger.info(`Stripe payment_intent.succeeded: ${pi.id}`);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as { id: string };
        await this.failPayment(pi.id);
        break;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'customer.subscription.deleted':
        logger.info(`Stripe event: ${event.type}`);
        break;
      default:
        logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }

  private async completeCheckout(session: CheckoutSessionPayload) {
    const employerId = session.metadata?.employerId;
    const subscriptionId = session.metadata?.subscriptionId;
    if (!employerId || !subscriptionId) return;

    const payments = await paymentsRepository.findByEmployer(employerId, 5);
    const payment = payments.find((p) => p.gatewayTransactionId === session.id);
    if (payment) {
      payment.status = PaymentStatus.SUCCESS;
      payment.paidAt = new Date();
      const pi = session.payment_intent;
      payment.gatewayTransactionId =
        typeof pi === 'string' ? pi : pi && typeof pi === 'object' ? pi.id : session.id;
      await paymentsRepository.save(payment);
    }

    await billingService.activateSubscription(subscriptionId, employerId);
  }

  private async failPayment(gatewayId: string) {
    logger.warn(`Payment failed for gateway id ${gatewayId}`);
  }
}

export const stripeBillingService = new StripeBillingService();
