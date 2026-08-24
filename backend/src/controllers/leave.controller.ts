import { Request, Response, NextFunction } from 'express';
import { leaveService, LeaveService } from '../services/leave.service.js';

export class LeaveController {
  constructor(private service: LeaveService = leaveService) {}

  createLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorId = req.params.id as string;
      const result = await this.service.createDoctorLeave(doctorId, req.body, req.user!);
      res.status(201).json({
        success: true,
        message: `Doctor leave scheduled successfully. ${result.affectedCount} existing appointment(s) transitioned to leave status with patient reschedule alerts sent.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getLeaves = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorId = req.params.id as string;
      const leaves = await this.service.getDoctorLeaves(doctorId);
      res.status(200).json({
        success: true,
        data: leaves,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorId = req.params.id as string;
      const leaveId = req.params.leaveId as string;
      const result = await this.service.deleteDoctorLeave(leaveId, doctorId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const leaveController = new LeaveController();
