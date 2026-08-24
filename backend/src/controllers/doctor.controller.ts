import { Request, Response, NextFunction } from 'express';
import { doctorService, DoctorService } from '../services/doctor.service.js';

export class DoctorController {
  constructor(private service: DoctorService = doctorService) {}

  getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getDoctors(req.query as any);
      res.status(200).json({
        success: true,
        data: result.doctors,
        meta: {
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getDoctorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const doctor = await this.service.getDoctorById(id);
      res.status(200).json({
        success: true,
        data: doctor,
      });
    } catch (error) {
      next(error);
    }
  };

  getSpecializations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const specializations = await this.service.getSpecializations();
      res.status(200).json({
        success: true,
        data: specializations,
      });
    } catch (error) {
      next(error);
    }
  };

  getWorkingHours = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const workingHours = await this.service.getWorkingHours(id);
      res.status(200).json({
        success: true,
        data: workingHours,
      });
    } catch (error) {
      next(error);
    }
  };

  setWorkingHours = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const hours = await this.service.setWorkingHours(id, req.body, req.user!);
      res.status(200).json({
        success: true,
        message: 'Doctor working hours updated successfully',
        data: hours,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const doctorController = new DoctorController();
