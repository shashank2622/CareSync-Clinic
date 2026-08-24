import { ReminderFrequency } from '@prisma/client';

export function getScheduledTimesForFrequency(frequency: ReminderFrequency): string[] {
  switch (frequency) {
    case ReminderFrequency.ONCE_DAILY:
      return ['08:00'];
    case ReminderFrequency.TWICE_DAILY:
    case ReminderFrequency.EVERY_12_HOURS:
      return ['08:00', '20:00'];
    case ReminderFrequency.THREE_TIMES_DAILY:
      return ['08:00', '14:00', '20:00'];
    case ReminderFrequency.EVERY_8_HOURS:
      return ['06:00', '14:00', '22:00'];
    case ReminderFrequency.CUSTOM:
    default:
      return ['09:00'];
  }
}

export function calculateNextRunDate(scheduledTime: string, fromDate: Date = new Date()): Date {
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const nextRun = new Date(fromDate);
  nextRun.setUTCHours(hours, minutes, 0, 0);

  // If time has already passed today in UTC, schedule for tomorrow
  if (nextRun <= fromDate) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }

  return nextRun;
}
