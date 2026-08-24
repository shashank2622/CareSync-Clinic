import { Queue } from 'bullmq';
import { getRedisClient, isRedisAvailable } from '../config/redis.js';
import { logger } from '../utils/logger.js';

let reminderQueue: Queue | null = null;

try {
  const redis = getRedisClient();
  if (redis) {
    reminderQueue = new Queue('reminderQueue', {
      connection: redis as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }
} catch (e: any) {
  logger.warn(`BullMQ reminderQueue init skipped: ${e.message}`);
}

export const getReminderQueue = (): Queue | null => reminderQueue;

export const enqueueMedicationReminderJob = async (data: { reminderId: string; patientId: string }) => {
  if (reminderQueue && isRedisAvailable()) {
    try {
      await reminderQueue.add('SEND_MEDICATION_REMINDER', data);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
};
