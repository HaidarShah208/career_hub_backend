import { logger } from '../logger';

export type NotificationType =
  | 'SUBSCRIPTION_ACTIVATED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SUBSCRIPTION_EXPIRED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PLAN_UPGRADE'
  | 'PLAN_DOWNGRADE'
  | 'EMPLOYER_APPROVED'
  | 'EMPLOYER_REJECTED';

interface NotificationPayload {
  to: string;
  subject: string;
  body: string;
  type: NotificationType;
}

/**
 * Notification dispatcher. Logs in all environments; wire an email provider
 * (Resend, SendGrid, SES) in production by extending sendEmail().
 */
export class NotificationService {
  async send(payload: NotificationPayload): Promise<void> {
    logger.info(`[notification:${payload.type}] to=${payload.to} subject="${payload.subject}"`);
    await this.sendEmail(payload);
  }

  private async sendEmail(payload: NotificationPayload): Promise<void> {
    if (process.env.NODE_ENV === 'production' && process.env.EMAIL_API_KEY) {
      // Placeholder for production email integration.
      logger.info(`Email queued for ${payload.to}`);
      return;
    }
    logger.debug(payload.body);
  }
}

export const notificationService = new NotificationService();
