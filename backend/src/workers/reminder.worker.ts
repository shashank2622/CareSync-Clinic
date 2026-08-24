import { reminderRepository } from '../repositories/reminder.repository.js';
import { prisma } from '../config/database.js';
import { calculateNextRunDate } from '../utils/frequency.js';
import { logger } from '../utils/logger.js';
import { NotificationType } from '@prisma/client';

export class ReminderWorker {
  private isProcessing = false;
  private intervalId: NodeJS.Timeout | null = null;

  async processDueReminders(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    let processedCount = 0;
    try {
      const dueReminders = await reminderRepository.findDueReminders(new Date());

      for (const reminder of dueReminders) {
        const now = new Date();
        const nextRun = calculateNextRunDate(reminder.scheduledTime, now);

        // 1. Create In-App Notification
        await prisma.notification.create({
          data: {
            userId: reminder.patient.userId,
            type: NotificationType.MEDICATION_REMINDER,
            title: `Medication Reminder: ${reminder.medication.name} (${reminder.medication.dosage})`,
            message: `It is time to take your scheduled dose of ${reminder.medication.name} (${reminder.medication.dosage}). ${reminder.medication.instructions ? `Instructions: ${reminder.medication.instructions}` : ''}`,
            metadata: {
              medicationId: reminder.medicationId,
              reminderId: reminder.id,
              frequency: reminder.frequency,
              scheduledTime: reminder.scheduledTime,
            },
          },
        });

        // 2. Advance nextRunAt
        await reminderRepository.updateReminderNextRun(reminder.id, now, nextRun);
        processedCount++;

        logger.info(
          `💊 Sent medication reminder to [${reminder.patient.user.email}] for ${reminder.medication.name}. Next dose scheduled for ${nextRun.toISOString()}`
        );
      }
    } catch (error: any) {
      logger.error('❌ Error processing medication reminders:', error.message);
    } finally {
      this.isProcessing = false;
    }

    return processedCount;
  }

  startScheduler(intervalMs: number = 60000) {
    if (this.intervalId) return;

    logger.info(`⏰ Background Medication Reminder Worker started (checking every ${intervalMs / 1000}s)`);
    // Run initial pass immediately
    this.processDueReminders();
    this.intervalId = setInterval(() => {
      this.processDueReminders();
    }, intervalMs);
  }

  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('🛑 Medication Reminder Worker stopped');
    }
  }
}

export const reminderWorker = new ReminderWorker();
