import { Request, Response, NextFunction } from 'express';
import { clinicalService, ClinicalService } from '../services/clinical.service.js';

export class ClinicalController {
  constructor(private service: ClinicalService = clinicalService) {}

  submitVisitNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.id as string;
      const completed = await this.service.submitVisitNotes(appointmentId, req.body, req.user!);
      res.status(200).json({
        success: true,
        message: 'Clinical notes and prescription recorded successfully. Consultation completed.',
        data: completed,
      });
    } catch (error) {
      next(error);
    }
  };

  getVisitNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.id as string;
      const notes = await this.service.getVisitNotes(appointmentId, req.user!);
      res.status(200).json({
        success: true,
        data: notes,
      });
    } catch (error) {
      next(error);
    }
  };

  getPrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.id as string;
      const prescription = await this.service.getPrescription(appointmentId, req.user!);
      res.status(200).json({
        success: true,
        data: prescription,
      });
    } catch (error) {
      next(error);
    }
  };

  getMyPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prescriptions = await this.service.getMyPrescriptions(req.user!);
      res.status(200).json({
        success: true,
        data: prescriptions,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const clinicalController = new ClinicalController();
