import { Worker, Job } from 'bullmq';
import { getRedisClient, isRedisAvailable } from '../config/redis.js';
import { EmailJobData } from '../jobs/email.queue.js';
import { IEmailProvider } from '../integrations/email/email.interface.js';
import { NodemailerProvider } from '../integrations/email/nodemailer.provider.js';
import { MockEmailProvider } from '../integrations/email/mock.provider.js';
import { emailRepository } from '../repositories/email.repository.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { DeliveryStatus } from '@prisma/client';

export class EmailWorker {
  private provider: IEmailProvider;
  private worker: Worker<EmailJobData> | null = null;

  constructor() {
    if (env.EMAIL_PROVIDER === 'smtp' && env.SMTP_USER) {
      this.provider = new NodemailerProvider();
    } else {
      this.provider = new MockEmailProvider();
    }
  }

  setProvider(provider: IEmailProvider) {
    this.provider = provider;
  }

  async processEmailJob(jobData: EmailJobData, attemptNumber: number = 1) {
    try {
      await this.provider.sendEmail({
        to: jobData.to,
        subject: jobData.subject,
        html: jobData.html,
        text: jobData.text,
        templateName: jobData.templateName,
      });

      if (jobData.deliveryId) {
        await emailRepository.updateDeliveryStatus(
          jobData.deliveryId,
          DeliveryStatus.SENT,
          attemptNumber
        );
      }
      return true;
    } catch (error: any) {
      const isFinalAttempt = attemptNumber >= 3;
      const nextStatus = isFinalAttempt ? DeliveryStatus.FAILED : DeliveryStatus.RETRYING;

      logger.warn(
        `⚠️  Email delivery attempt #${attemptNumber} failed for [${jobData.to}]: ${error.message}. Status: ${nextStatus}`
      );

      if (jobData.deliveryId) {
        await emailRepository.updateDeliveryStatus(
          jobData.deliveryId,
          nextStatus,
          attemptNumber,
          error.message
        );
      }

      throw error;
    }
  }

  initQueueWorker() {
    const redis = getRedisClient();
    if (!redis || !isRedisAvailable()) {
      logger.info('📧 EmailWorker running in direct async dispatch mode (Redis queue offline)');
      return;
    }

    try {
      this.worker = new Worker<EmailJobData>(
        'emailQueue',
        async (job: Job<EmailJobData>) => {
          return this.processEmailJob(job.data, job.attemptsMade + 1);
        },
        {
          connection: redis as any,
          concurrency: 5,
        }
      );

      this.worker.on('completed', (job) => {
        logger.info(`✅ Email job [${job.id}] delivered to ${job.data.to}`);
      });

      this.worker.on('failed', (job, err) => {
        logger.error(`❌ Email job [${job?.id}] failed after all retries: ${err.message}`);
      });

      logger.info('🚀 BullMQ Email Worker registered and listening for background tasks');
    } catch (e: any) {
      logger.warn(`BullMQ EmailWorker registration skipped: ${e.message}`);
    }
  }
}

export const emailWorker = new EmailWorker();
