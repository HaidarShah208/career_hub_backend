import cron from 'node-cron';
import { logger } from '../shared/logger';
import { billingService } from '../modules/billing/billing.service';

/** Marks overdue ACTIVE subscriptions as EXPIRED (runs daily at 00:05 UTC). */
export function startSubscriptionExpiryJob(): void {
  cron.schedule('5 0 * * *', async () => {
    try {
      const count = await billingService.expireDueSubscriptions();
      if (count > 0) {
        logger.info(`Subscription expiry job processed ${count} subscription(s)`);
      }
    } catch (err) {
      logger.error(`Subscription expiry job failed: ${(err as Error).message}`);
    }
  });
  logger.info('Subscription expiry cron scheduled (daily 00:05 UTC)');
}
