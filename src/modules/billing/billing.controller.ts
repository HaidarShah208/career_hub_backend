import { Request, Response } from 'express';
import { PaymentStatus } from '../../shared/constants';
import { sendSuccess } from '../../shared/utils/api-response';
import { billingService } from './billing.service';
import { stripeBillingService } from './stripe.service';

export class BillingController {
  /** GET /billing/plans — public active plans */
  async listPlans(_req: Request, res: Response): Promise<Response> {
    const plans = await billingService.listPublicPlans();
    return sendSuccess(res, plans, 'Plans retrieved');
  }

  /** GET /employer/billing/overview */
  async employerOverview(req: Request, res: Response): Promise<Response> {
    const data = await billingService.getEmployerOverview(req.user!.id);
    return sendSuccess(res, data, 'Billing overview retrieved');
  }

  /** POST /employer/billing/payments/manual */
  async createManualPayment(req: Request, res: Response): Promise<Response> {
    const result = await billingService.createManualPayment(req.user!.id, req.body);
    return sendSuccess(res, result, 'Payment submitted for verification', 201);
  }

  /** POST /employer/billing/checkout/stripe */
  async stripeCheckout(req: Request, res: Response): Promise<Response> {
    const { planId, successUrl, cancelUrl } = req.body;
    const session = await stripeBillingService.createCheckoutSession(
      req.user!.id,
      req.user!.email,
      planId,
      successUrl,
      cancelUrl,
    );
    return sendSuccess(res, session, 'Checkout session created');
  }

  /** POST /employer/billing/upgrade */
  async requestUpgrade(req: Request, res: Response): Promise<Response> {
    const result = await billingService.requestUpgrade(req.user!.id, req.body.planId);
    return sendSuccess(res, result, 'Upgrade quote calculated');
  }

  /** POST /employer/billing/downgrade */
  async scheduleDowngrade(req: Request, res: Response): Promise<Response> {
    const sub = await billingService.scheduleDowngrade(req.user!.id, req.body.planId);
    return sendSuccess(res, sub, 'Downgrade scheduled for next renewal');
  }

  /** POST /billing/webhooks/stripe */
  async stripeWebhook(req: Request, res: Response): Promise<Response> {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing stripe-signature' });
    }
    const result = await stripeBillingService.handleWebhook(req.body as Buffer, signature);
    return res.json(result);
  }

  // ---- Admin ----

  async adminListPlans(_req: Request, res: Response): Promise<Response> {
    const plans = await billingService.adminListPlans();
    return sendSuccess(res, plans, 'Plans retrieved');
  }

  async adminCreatePlan(req: Request, res: Response): Promise<Response> {
    const plan = await billingService.adminCreatePlan(req.body);
    return sendSuccess(res, plan, 'Plan created', 201);
  }

  async adminUpdatePlan(req: Request, res: Response): Promise<Response> {
    const plan = await billingService.adminUpdatePlan(req.params.id, req.body);
    return sendSuccess(res, plan, 'Plan updated');
  }

  async adminDeletePlan(req: Request, res: Response): Promise<Response> {
    const plan = await billingService.adminDeletePlan(req.params.id);
    return sendSuccess(res, plan, 'Plan deactivated');
  }

  async adminListSubscriptions(_req: Request, res: Response): Promise<Response> {
    const items = await billingService.adminListSubscriptions();
    return sendSuccess(res, items, 'Subscriptions retrieved');
  }

  async adminListPayments(req: Request, res: Response): Promise<Response> {
    const status = req.query.status as PaymentStatus | undefined;
    const items = await billingService.adminListPayments(status);
    return sendSuccess(res, items, 'Payments retrieved');
  }

  async adminVerifyPayment(req: Request, res: Response): Promise<Response> {
    const payment = await billingService.verifyManualPayment(
      req.params.id,
      req.user!.id,
      req.body.approved,
    );
    return sendSuccess(res, payment, req.body.approved ? 'Payment approved' : 'Payment rejected');
  }
}

export const billingController = new BillingController();
