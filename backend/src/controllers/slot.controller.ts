import { Request, Response, NextFunction } from 'express';
import { slotService, SlotService } from '../services/slot.service.js';

export class SlotController {
  constructor(private service: SlotService = slotService) {}

  getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorId = req.params.id as string;
      const dateStr = req.query.date as string;
      const patientId = req.user?.patientProfile?.id;

      const availability = await this.service.getDoctorAvailability(doctorId, dateStr, patientId);

      res.status(200).json({
        success: true,
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  };

  getMonthAvailableDates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorId = req.params.id as string;
      const monthStr = req.query.month as string;

      const dates = await this.service.getMonthAvailableDates(doctorId, monthStr);

      res.status(200).json({
        success: true,
        data: dates,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const slotController = new SlotController();
