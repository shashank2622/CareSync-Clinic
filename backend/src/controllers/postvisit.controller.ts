import { Request, Response, NextFunction } from 'express';
import { postVisitService, PostVisitService } from '../services/postvisit.service.js';

export class PostVisitController {
  constructor(private service: PostVisitService = postVisitService) {}

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.id as string;
      const summary = await this.service.getPostVisitSummary(appointmentId, req.user!);
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
      const summary = await this.service.generatePostVisitSummary(appointmentId, req.user!);
      res.status(200).json({
        success: true,
        message: 'Patient-friendly post-visit AI summary generated successfully',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  retrySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.id as string;
      const summary = await this.service.retryPostVisitSummary(appointmentId, req.user!);
      res.status(200).json({
        success: true,
        message: 'Patient-friendly post-visit AI summary regenerated',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const postVisitController = new PostVisitController();
