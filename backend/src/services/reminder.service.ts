import { reminderRepository, ReminderRepository } from '../repositories/reminder.repository.js';
import { prisma } from '../config/database.js';
import { reminderWorker } from '../workers/reminder.worker.js';
import { AppError } from '../utils/app-error.js';
import { getScheduledTimesForFrequency, calculateNextRunDate } from '../utils/frequency.js';
import { AuthenticatedUser } from '../types/auth.types.js';
import { Role } from '@prisma/client';

export class ReminderService {
  constructor(private repo: ReminderRepository = reminderRepository) {}

  async generateRemindersForPrescription(prescriptionId: string) {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        medications: true,
        appointment: true,
      },
    });

    if (!prescription) {
      throw AppError.notFound('Prescription not found');
    }

    const patientId = prescription.appointment.patientId;
    const remindersToCreate: Array<{
      medicationId: string;
      patientId: string;
      scheduledTime: string;
      frequency: any;
      nextRunAt: Date;
    }> = [];

    for (const med of prescription.medications) {
      // Clear previous reminders for this med if regenerating
      await this.repo.deleteRemindersByMedicationId(med.id);

      const times = getScheduledTimesForFrequency(med.frequency);
      for (const timeStr of times) {
        const nextRun = calculateNextRunDate(timeStr);
        remindersToCreate.push({
          medicationId: med.id,
          patientId,
          scheduledTime: timeStr,
          frequency: med.frequency,
          nextRunAt: nextRun,
        });
      }
    }

    if (remindersToCreate.length > 0) {
      await this.repo.createReminders(remindersToCreate);
    }

    return this.repo.findPatientReminders(patientId);
  }

  async getActiveReminders(user: AuthenticatedUser) {
    if (user.role !== Role.PATIENT || !user.patientProfile) {
      throw AppError.forbidden('Only registered patients can view their medication reminders');
    }

    return this.repo.findPatientReminders(user.patientProfile.id);
  }

  async toggleReminder(reminderId: string, isActive: boolean, user: AuthenticatedUser) {
    if (user.role !== Role.PATIENT || !user.patientProfile) {
      throw AppError.forbidden('Only registered patients can manage their reminders');
    }

    const reminders = await this.repo.findPatientReminders(user.patientProfile.id);
    const target = reminders.find((r) => r.id === reminderId);

    if (!target) {
      throw AppError.notFound('Medication reminder not found or does not belong to you');
    }

    return this.repo.toggleReminder(reminderId, isActive);
  }

  async triggerManualProcessing() {
    return reminderWorker.processDueReminders();
  }
}

export const reminderService = new ReminderService();
