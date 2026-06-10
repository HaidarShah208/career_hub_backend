import { Router } from 'express';
import { UserRole } from '../../shared/constants';
import { adminOnly, authenticate, authorize, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import { billingController } from './billing.controller';
import {
  adminPlanSchema,
  adminUpdatePlanSchema,
  createManualPaymentSchema,
  listPaymentsQuerySchema,
  planIdBodySchema,
  stripeCheckoutSchema,
  verifyPaymentSchema,
} from './billing.validation';

const router = Router();
const c = billingController;

router.get('/plans', asyncHandler(c.listPlans.bind(c)));

const employerBilling = Router();
employerBilling.use(authenticate, authorize(UserRole.EMPLOYER));
employerBilling.get('/overview', asyncHandler(c.employerOverview.bind(c)));
employerBilling.post(
  '/payments/manual',
  validate(createManualPaymentSchema),
  asyncHandler(c.createManualPayment.bind(c)),
);
employerBilling.post(
  '/checkout/stripe',
  validate(stripeCheckoutSchema),
  asyncHandler(c.stripeCheckout.bind(c)),
);
employerBilling.post(
  '/upgrade',
  validate(planIdBodySchema),
  asyncHandler(c.requestUpgrade.bind(c)),
);
employerBilling.post(
  '/downgrade',
  validate(planIdBodySchema),
  asyncHandler(c.scheduleDowngrade.bind(c)),
);
router.use('/employer/billing', employerBilling);

const adminBilling = Router();
adminBilling.use(authenticate, adminOnly);
adminBilling.get('/plans', asyncHandler(c.adminListPlans.bind(c)));
adminBilling.post('/plans', validate(adminPlanSchema), asyncHandler(c.adminCreatePlan.bind(c)));
adminBilling.put('/plans/:id', validate(adminUpdatePlanSchema), asyncHandler(c.adminUpdatePlan.bind(c)));
adminBilling.delete('/plans/:id', asyncHandler(c.adminDeletePlan.bind(c)));
adminBilling.get('/subscriptions', asyncHandler(c.adminListSubscriptions.bind(c)));
adminBilling.get('/payments', validate(listPaymentsQuerySchema), asyncHandler(c.adminListPayments.bind(c)));
adminBilling.patch(
  '/payments/:id/verify',
  validate(verifyPaymentSchema),
  asyncHandler(c.adminVerifyPayment.bind(c)),
);
router.use('/admin/billing', adminBilling);

export default router;
