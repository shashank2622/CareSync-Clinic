import nodemailer, { Transporter } from 'nodemailer';
import { IEmailProvider, SendEmailOptions } from './email.interface.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export class NodemailerProvider implements IEmailProvider {
  public readonly name = 'nodemailer';
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            }
          : undefined,
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<{ messageId: string; previewUrl?: string }> {
    try {
      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

      logger.info(`📧 Email sent to [${options.to}] (Subject: "${options.subject}") | MessageId: ${info.messageId}`);
      if (previewUrl) {
        logger.info(`🔗 Ethereal Email Preview: ${previewUrl}`);
      }

      return {
        messageId: info.messageId,
        previewUrl: typeof previewUrl === 'string' ? previewUrl : undefined,
      };
    } catch (error: any) {
      logger.error(`❌ Nodemailer send failed to [${options.to}]: ${error.message}`);
      throw error;
    }
  }
}
