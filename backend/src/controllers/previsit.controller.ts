import { Request, Response, NextFunction } from 'express';
import { preVisitService, PreVisitService } from '../services/previsit.service.js';

export class PreVisitController {
  constructor(private service: PreVisitService = preVisitService) {}

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.id as string;
      const summary = await this.service.getPreVisitSummary(appointmentId, req.user!);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  generateSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.id as string;
      const summary = await this.service.generatePreVisitSummary(appointmentId, req.user!);
      res.status(200).json({
        success: true,
        message: 'Pre-visit AI clinical summary generated successfully',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  retrySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.id as string;
      const summary = await this.service.retryPreVisitSummary(appointmentId, req.user!);
      res.status(200).json({
        success: true,
        message: 'Pre-visit AI clinical summary regenerated',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const preVisitController = new PreVisitController();
