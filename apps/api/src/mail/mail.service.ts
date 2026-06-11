import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Transactional email via SMTP (Mailtrap in dev, any SMTP in prod) — G-14.
 *
 * Credentials come only from env (NFR-04 §12): SMTP_HOST/PORT/USER/PASSWORD.
 * When no SMTP host is configured the service is "disabled": callers fall back
 * to dev behaviour (auto-verify) and tokens are logged instead of mailed.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  /**
   * True only when SMTP host + credentials are all present, so verification
   * emails can actually be delivered. A half-configured SMTP (host but no
   * credentials) stays disabled so accounts don't get stuck unverified.
   */
  get enabled(): boolean {
    return Boolean(
      this.config.get<string>('SMTP_HOST') &&
        this.config.get<string>('SMTP_USER') &&
        this.config.get<string>('SMTP_PASSWORD'),
    );
  }

  private get from(): string {
    return this.config.get<string>('MAIL_FROM', 'no-reply@msl.example');
  }

  private get webBaseUrl(): string {
    return this.config.get<string>('WEB_BASE_URL', 'http://localhost:3000').replace(/\/$/, '');
  }

  private getTransporter(): Transporter | null {
    if (!this.enabled) return null;
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST'),
        port: Number(this.config.get<string>('SMTP_PORT', '587')),
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASSWORD'),
        },
      });
    }
    return this.transporter;
  }

  /** Send the account email-verification message (AUTH-02). Best-effort. */
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${this.webBaseUrl}/verify-email?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Имэйл хаягаа баталгаажуулна уу',
      `<p>Сайн байна уу,</p>
       <p>Монгол дохионы хэлний платформд бүртгүүлсэнд баярлалаа. Доорх товчийг дарж имэйл хаягаа баталгаажуулна уу:</p>
       <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none">Имэйл баталгаажуулах</a></p>
       <p>Эсвэл энэ холбоосыг хуулна уу: <br>${link}</p>
       <p>Хэрэв та бүртгүүлээгүй бол энэ имэйлийг үл тоомсорлоно уу.</p>`,
    );
  }

  /** Send the password-reset message (G-14). Best-effort. */
  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${this.webBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Нууц үг сэргээх',
      `<p>Сайн байна уу,</p>
       <p>Нууц үг сэргээх хүсэлт хүлээн авлаа. Доорх товчийг дарж шинэ нууц үг тогтооно уу:</p>
       <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none">Нууц үг сэргээх</a></p>
       <p>Эсвэл энэ холбоосыг хуулна уу: <br>${link}</p>
       <p>Хэрэв та хүсэлт гаргаагүй бол энэ имэйлийг үл тоомсорлоно уу.</p>`,
    );
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured — skipped email "${subject}" to ${to}`);
      return;
    }
    try {
      await transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Sent "${subject}" email to ${to}`);
    } catch (err) {
      // Never block the request on a mail failure (G-14) — log and move on.
      this.logger.error(`Failed to send "${subject}" email to ${to}: ${(err as Error).message}`);
    }
  }
}
