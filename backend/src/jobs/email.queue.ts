import { Queue } from 'bullmq';
import { getRedisClient, isRedisAvailable } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { SendEmailOptions } from '../integrations/email/email.interface.js';

export interface EmailJobData extends SendEmailOptions {
  deliveryId: string;
}

let emailQueue: Queue<EmailJobData> | null = null;

try {
  const redis = getRedisClient();
  if (redis) {
    emailQueue = new Queue('emailQueue', {
      connection: redis as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, 10s, 20s
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }
} catch (e: any) {
  logger.warn(`BullMQ emailQueue init skipped: ${e.message}`);
}

export const getEmailQueue = (): Queue<EmailJobData> | null => emailQueue;

export const enqueueEmailJob = async (data: EmailJobData) => {
  if (emailQueue && isRedisAvailable()) {
    try {
      await emailQueue.add('SEND_EMAIL', data);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
};
