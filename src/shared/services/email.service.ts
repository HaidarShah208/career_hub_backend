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

function buildPasswordResetHtml(name: string, resetUrl: string): string {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2>Reset your password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your Pakistan Career Hub password.</p>
      <p style="margin-top:10px; margin-bottom:10px"><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px">Create new password</a></p>
      <p style="color:#666;font-size:14px">This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
    </div>
  `;
}

export class EmailService {
  private get isSmtpConfigured(): boolean {
    return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
  }

  private async deliver(to: string, subject: string, html: string, text: string, logLabel: string): Promise<void> {
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
      logger.info(`${logLabel} sent to ${to}`);
      return;
    }

    logger.info(`\n📧 ${logLabel} (SMTP not configured — copy link below)\nTo: ${to}\nLink: ${text.split(': ').pop()}\n`);
  }

  async sendVerificationEmail(to: string, verifyUrl: string, name: string): Promise<void> {
    const subject = 'Verify your email — Pakistan Career Hub';
    const html = buildVerificationHtml(name, verifyUrl);
    const text = `Hi ${name}, verify your email: ${verifyUrl}`;
    await this.deliver(to, subject, html, text, 'VERIFICATION EMAIL');
  }

  async sendPasswordResetEmail(to: string, resetUrl: string, name: string): Promise<void> {
    const subject = 'Reset your password — Pakistan Career Hub';
    const html = buildPasswordResetHtml(name, resetUrl);
    const text = `Hi ${name}, reset your password: ${resetUrl}`;
    await this.deliver(to, subject, html, text, 'PASSWORD RESET EMAIL');
  }
}

export const emailService = new EmailService();
