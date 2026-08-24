import { Request, Response, NextFunction } from 'express';
import { reminderService, ReminderService } from '../services/reminder.service.js';

export class ReminderController {
  constructor(private service: ReminderService = reminderService) {}

  getActiveReminders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reminders = await this.service.getActiveReminders(req.user!);
      res.status(200).json({
        success: true,
        data: reminders,
      });
    } catch (error) {
      next(error);
    }
  };

  toggleReminder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reminderId = req.params.id as string;
      const { isActive } = req.body;
      const updated = await this.service.toggleReminder(reminderId, !!isActive, req.user!);
      res.status(200).json({
        success: true,
        message: `Medication reminder has been ${isActive ? 'enabled' : 'paused'}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  generateForPrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prescriptionId = req.params.prescriptionId as string;
      const reminders = await this.service.generateRemindersForPrescription(prescriptionId);
      res.status(201).json({
        success: true,
        message: 'Medication reminders generated from prescription schedule',
        data: reminders,
      });
    } catch (error) {
      next(error);
    }
  };

  triggerProcess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await this.service.triggerManualProcessing();
      res.status(200).json({
        success: true,
        message: `Processed ${count} due medication reminders`,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const reminderController = new ReminderController();
