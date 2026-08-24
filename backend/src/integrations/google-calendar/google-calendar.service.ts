import { google } from 'googleapis';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { encryptText, decryptText } from '../../utils/crypto.js';
import { logger } from '../../utils/logger.js';
import { CalendarSyncStatus } from '@prisma/client';

export class GoogleCalendarService {
  private getOAuthClient() {
    return new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );
  }

  generateAuthUrl(userId: string): string {
    const oauth2Client = this.getOAuthClient();
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: userId, // Embed user ID in state for security and context
    });
  }

  async handleOAuthCallback(code: string, userId: string) {
    const oauth2Client = this.getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('Failed to retrieve access token from Google OAuth');
    }

    const accessTokenEncrypted = encryptText(tokens.access_token);
    const refreshTokenEncrypted = tokens.refresh_token ? encryptText(tokens.refresh_token) : '';

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    const saved = await prisma.googleOAuthToken.upsert({
      where: { userId },
      create: {
        userId,
        accessTokenEncrypted,
        refreshTokenEncrypted: refreshTokenEncrypted || accessTokenEncrypted,
        expiresAt,
        scope: tokens.scope || 'https://www.googleapis.com/auth/calendar.events',
      },
      update: {
        accessTokenEncrypted,
        ...(refreshTokenEncrypted ? { refreshTokenEncrypted } : {}),
        expiresAt,
        scope: tokens.scope || undefined,
      },
    });

    logger.info(`📅 Google Calendar successfully connected for user [${userId}]`);
    return saved;
  }

  async disconnect(userId: string) {
    await prisma.googleOAuthToken.deleteMany({
      where: { userId },
    });
    logger.info(`📅 Google Calendar disconnected for user [${userId}]`);
    return { success: true, message: 'Google Calendar disconnected' };
  }

  private async getAuthenticatedCalendarClient(userId: string) {
    const tokenRecord = await prisma.googleOAuthToken.findUnique({
      where: { userId },
    });

    if (!tokenRecord) return null;

    const oauth2Client = this.getOAuthClient();
    const accessToken = decryptText(tokenRecord.accessTokenEncrypted);
    const refreshToken = decryptText(tokenRecord.refreshTokenEncrypted);

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: tokenRecord.expiresAt.getTime(),
    });

    // Auto refresh listener
    oauth2Client.on('tokens', async (newTokens) => {
      if (newTokens.access_token) {
        await prisma.googleOAuthToken.update({
          where: { userId },
          data: {
            accessTokenEncrypted: encryptText(newTokens.access_token),
            expiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
          },
        });
      }
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  async syncBookingCreated(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
        symptomSubmission: true,
      },
    });

    if (!appointment) return;

    let googleEventIdDoctor: string | null = null;
    let googleEventIdPatient: string | null = null;
    let syncStatus: CalendarSyncStatus = CalendarSyncStatus.SYNCED;
    let errorMessage: string | null = null;

    const eventPayload = {
      summary: `Medical Consultation: Dr. ${appointment.doctor.user.fullName} & ${appointment.patient.user.fullName}`,
      description: `Appointment #${appointment.appointmentNumber}\nSpecialization: ${appointment.doctor.specialization}\n${
        appointment.symptomSubmission ? `Chief Complaint: ${appointment.symptomSubmission.chiefComplaint}` : ''
      }`,
      start: {
        dateTime: appointment.slotStartTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: appointment.slotEndTime.toISOString(),
        timeZone: 'UTC',
      },
      status: 'confirmed',
    };

    try {
      // 1. Sync on Doctor Calendar if connected
      const docCalendar = await this.getAuthenticatedCalendarClient(appointment.doctor.userId);
      if (docCalendar) {
        const res = await docCalendar.events.insert({
          calendarId: 'primary',
          requestBody: eventPayload,
        });
        googleEventIdDoctor = res.data.id || null;
      }

      // 2. Sync on Patient Calendar if connected
      const patCalendar = await this.getAuthenticatedCalendarClient(appointment.patient.userId);
      if (patCalendar) {
        const res = await patCalendar.events.insert({
          calendarId: 'primary',
          requestBody: eventPayload,
        });
        googleEventIdPatient = res.data.id || null;
      }
    } catch (err: any) {
      syncStatus = CalendarSyncStatus.FAILED;
      errorMessage = err.message;
      logger.warn(`⚠️  Google Calendar sync failed for appointment ${appointmentId}: ${err.message}`);
    }

    // Save or update calendar event record
    await prisma.calendarEvent.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        googleEventIdDoctor,
        googleEventIdPatient,
        syncStatus,
        lastSyncedAt: new Date(),
        errorMessage,
      },
      update: {
        googleEventIdDoctor: googleEventIdDoctor || undefined,
        googleEventIdPatient: googleEventIdPatient || undefined,
        syncStatus,
        lastSyncedAt: new Date(),
        errorMessage,
      },
    });
  }

  async syncBookingRescheduled(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
        calendarEvent: true,
      },
    });

    if (!appointment || !appointment.calendarEvent) return;

    const patchPayload = {
      start: { dateTime: appointment.slotStartTime.toISOString(), timeZone: 'UTC' },
      end: { dateTime: appointment.slotEndTime.toISOString(), timeZone: 'UTC' },
    };

    try {
      if (appointment.calendarEvent.googleEventIdDoctor) {
        const docCal = await this.getAuthenticatedCalendarClient(appointment.doctor.userId);
        if (docCal) {
          await docCal.events.patch({
            calendarId: 'primary',
            eventId: appointment.calendarEvent.googleEventIdDoctor,
            requestBody: patchPayload,
          });
        }
      }

      if (appointment.calendarEvent.googleEventIdPatient) {
        const patCal = await this.getAuthenticatedCalendarClient(appointment.patient.userId);
        if (patCal) {
          await patCal.events.patch({
            calendarId: 'primary',
            eventId: appointment.calendarEvent.googleEventIdPatient,
            requestBody: patchPayload,
          });
        }
      }

      await prisma.calendarEvent.update({
        where: { appointmentId },
        data: {
          syncStatus: CalendarSyncStatus.SYNCED,
          lastSyncedAt: new Date(),
        },
      });
    } catch (err: any) {
      logger.warn(`Google Calendar reschedule sync failed for ${appointmentId}: ${err.message}`);
    }
  }

  async syncBookingCancelled(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
        calendarEvent: true,
      },
    });

    if (!appointment || !appointment.calendarEvent) return;

    try {
      if (appointment.calendarEvent.googleEventIdDoctor) {
        const docCal = await this.getAuthenticatedCalendarClient(appointment.doctor.userId);
        if (docCal) {
          await docCal.events.delete({
            calendarId: 'primary',
            eventId: appointment.calendarEvent.googleEventIdDoctor,
          });
        }
      }

      if (appointment.calendarEvent.googleEventIdPatient) {
        const patCal = await this.getAuthenticatedCalendarClient(appointment.patient.userId);
        if (patCal) {
          await patCal.events.delete({
            calendarId: 'primary',
            eventId: appointment.calendarEvent.googleEventIdPatient,
          });
        }
      }

      await prisma.calendarEvent.update({
        where: { appointmentId },
        data: {
          syncStatus: CalendarSyncStatus.CANCELLED,
          lastSyncedAt: new Date(),
        },
      });
    } catch (err: any) {
      logger.warn(`Google Calendar cancellation sync failed for ${appointmentId}: ${err.message}`);
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
