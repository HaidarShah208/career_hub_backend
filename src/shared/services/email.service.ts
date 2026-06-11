import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../logger';

function buildVerificationHtml(name: string, verifyUrl: string): string {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2>Verify your email</h2>
      <p>Hi ${name},</p>
      <p>Thanks for signing up on Pakistan Career Hub. Please confirm your email address to activate your account.</p>
      <p style="margin-top:10px; margin-bottom:10px"><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px">Verify email</a></p>
      <p style="color:#666;font-size:14px">This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
    </div>
  `;
}

export class EmailService {
  private get isSmtpConfigured(): boolean {
    return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
  }

  async sendVerificationEmail(to: string, verifyUrl: string, name: string): Promise<void> {
    const subject = 'Verify your email — Pakistan Career Hub';
    const html = buildVerificationHtml(name, verifyUrl);
    const text = `Hi ${name}, verify your email to activate your Pakistan Career Hub account: ${verifyUrl}`;

    if (this.isSmtpConfigured) {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: env.SMTP_FROM ?? env.SMTP_USER,
        to,
        subject,
        html,
        text,
      });
      logger.info(`Verification email sent to ${to}`);
      return;
    }

    logger.info(
      `\n📧 VERIFICATION EMAIL (SMTP not configured — copy link below)\n` +
        `To: ${to}\n` +
        `Link: ${verifyUrl}\n`,
    );
  }
}

export const emailService = new EmailService();
