import { Request, Response, NextFunction } from 'express';
import { googleCalendarService, GoogleCalendarService } from '../integrations/google-calendar/google-calendar.service.js';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';

export class CalendarController {
  constructor(private service: GoogleCalendarService = googleCalendarService) {}

  getConnectUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const url = this.service.generateAuthUrl(req.user!.id);
      res.status(200).json({
        success: true,
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  };

  handleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, state } = req.query;
      const userId = (state as string) || req.user?.id;

      if (!code || !userId) {
        res.redirect(`${env.FRONTEND_URL}/profile?calendar_connected=error&reason=missing_code`);
        return;
      }

      await this.service.handleOAuthCallback(code as string, userId);

      // Redirect back to frontend profile
      res.redirect(`${env.FRONTEND_URL}/profile?calendar_connected=success`);
    } catch (error: any) {
      res.redirect(`${env.FRONTEND_URL}/profile?calendar_connected=error&reason=${encodeURIComponent(error.message)}`);
    }
  };

  disconnect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.disconnect(req.user!.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = await prisma.googleOAuthToken.findUnique({
        where: { userId: req.user!.id },
      });

      res.status(200).json({
        success: true,
        data: {
          isConnected: !!token,
          connectedAt: token?.createdAt || null,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  manualSync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentId = req.params.appointmentId as string;
      await this.service.syncBookingCreated(appointmentId);
      res.status(200).json({
        success: true,
        message: 'Google Calendar event synchronized successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const calendarController = new CalendarController();
