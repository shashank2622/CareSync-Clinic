import { Request, Response, NextFunction } from 'express';
import { symptomService, SymptomService } from '../services/symptom.service.js';

export class SymptomController {
  constructor(private service: SymptomService = symptomService) {}

  submitSymptoms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.id as string;
      const symptoms = await this.service.submitSymptoms(appointmentId, req.body, req.user!);
      res.status(200).json({
        success: true,
        message: 'Patient symptoms submitted successfully',
        data: symptoms,
      });
    } catch (error) {
      next(error);
    }
  };

  getSymptoms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.id as string;
      const symptoms = await this.service.getSymptoms(appointmentId, req.user!);
      res.status(200).json({
        success: true,
        data: symptoms,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const symptomController = new SymptomController();
