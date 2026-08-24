import { Request, Response, NextFunction } from 'express';
import { appointmentService, AppointmentService } from '../services/appointment.service.js';
import { AppError } from '../utils/app-error.js';

export class AppointmentController {
  constructor(private service: AppointmentService = appointmentService) {}

  createHold = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const patientId = req.user?.patientProfile?.id;
      if (!patientId) {
        throw AppError.forbidden('Only registered patients with completed profiles can hold appointment slots');
      }

      const hold = await this.service.createSlotHold(req.body, patientId);
      res.status(201).json({
        success: true,
        message: 'Slot held successfully for 5 minutes',
        data: hold,
      });
    } catch (error) {
      next(error);
    }
  };

  releaseHold = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const patientId = req.user?.patientProfile?.id;
      if (!patientId) {
        throw AppError.forbidden('Only registered patients can release slot holds');
      }

      const holdToken = req.params.holdToken as string;
      const result = await this.service.releaseSlotHold(holdToken, patientId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  confirmAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const patientId = req.user?.patientProfile?.id;
      if (!patientId) {
        throw AppError.forbidden('Only registered patients can confirm appointments');
      }

      const appointment = await this.service.confirmAppointment(req.body, patientId);
      res.status(201).json({
        success: true,
        message: 'Appointment confirmed successfully',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  };

  getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getAppointments(req.user!, req.query as any);
      res.status(200).json({
        success: true,
        data: result.appointments,
        meta: {
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const appointment = await this.service.getAppointmentById(id, req.user!);
      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  };

  cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const updated = await this.service.cancelAppointment(id, req.body, req.user!);
      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  rescheduleAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const updated = await this.service.rescheduleAppointment(id, req.body, req.user!);
      res.status(200).json({
        success: true,
        message: 'Appointment rescheduled successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const appointmentController = new AppointmentController();
