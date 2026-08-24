import { prisma } from '../config/database.js';
import { ReminderFrequency } from '@prisma/client';

export class ReminderRepository {
  async createReminders(
    data: Array<{
      medicationId: string;
      patientId: string;
      scheduledTime: string;
      frequency: ReminderFrequency;
      nextRunAt: Date;
    }>
  ) {
    return prisma.medicationReminder.createMany({
      data: data.map((d) => ({
        medicationId: d.medicationId,
        patientId: d.patientId,
        scheduledTime: d.scheduledTime,
        frequency: d.frequency,
        nextRunAt: d.nextRunAt,
        isActive: true,
      })),
    });
  }

  async findPatientReminders(patientId: string) {
    return prisma.medicationReminder.findMany({
      where: { patientId },
      include: {
        medication: {
          include: {
            prescription: {
              include: {
                appointment: {
                  include: {
                    doctor: {
                      include: { user: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });
  }

  async findDueReminders(cutoff: Date = new Date()) {
    return prisma.medicationReminder.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: cutoff },
      },
      include: {
        medication: true,
        patient: {
          include: { user: true },
        },
      },
    });
  }

  async toggleReminder(id: string, isActive: boolean) {
    return prisma.medicationReminder.update({
      where: { id },
      data: { isActive },
    });
  }

  async updateReminderNextRun(id: string, lastSentAt: Date, nextRunAt: Date) {
    return prisma.medicationReminder.update({
      where: { id },
      data: {
        lastSentAt,
        nextRunAt,
      },
    });
  }

  async deleteRemindersByMedicationId(medicationId: string) {
    return prisma.medicationReminder.deleteMany({
      where: { medicationId },
    });
  }
}

export const reminderRepository = new ReminderRepository();
