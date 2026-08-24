import { emailRepository, EmailRepository } from '../repositories/email.repository.js';
import { appointmentRepository, AppointmentRepository } from '../repositories/appointment.repository.js';
import { prisma } from '../config/database.js';
import { enqueueEmailJob } from '../jobs/email.queue.js';
import { emailWorker } from '../workers/email.worker.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import {
  renderBookingConfirmationEmail,
  renderCancellationEmail,
  renderRescheduleEmail,
  renderDoctorLeaveAlertEmail,
  renderAppointmentReminderEmail,
} from '../integrations/email/templates/appointment.templates.js';
import { NotificationType } from '@prisma/client';

export class EmailService {
  constructor(
    private emailRepo: EmailRepository = emailRepository,
    private appointmentRepo: AppointmentRepository = appointmentRepository
  ) {}

  private async dispatchEmail(options: {
    recipientEmail: string;
    subject: string;
    html: string;
    templateName: string;
    notificationId?: string;
  }) {
    // 1. Create delivery audit record
    const delivery = await this.emailRepo.createDelivery({
      recipientEmail: options.recipientEmail,
      subject: options.subject,
      templateName: options.templateName,
      notificationId: options.notificationId,
    });

    const jobData = {
      ...options,
      deliveryId: delivery.id,
      to: options.recipientEmail,
    };

    // 2. Attempt queueing via BullMQ, or fall back to non-blocking async dispatch
    const enqueued = await enqueueEmailJob(jobData);
    if (!enqueued) {
      // Non-blocking in-process dispatch
      setImmediate(() => {
        emailWorker.processEmailJob(jobData).catch((err) => {
          logger.warn(`Non-blocking email dispatch failed for ${options.recipientEmail}: ${err.message}`);
        });
      });
    }

    return delivery;
  }

  async sendBookingConfirmation(appointmentId: string) {
    const appointment = await this.appointmentRepo.findAppointmentById(appointmentId);
    if (!appointment) return;

    const dateStr = appointment.slotStartTime.toISOString().split('T')[0];
    const timeStr = appointment.slotStartTime.toISOString().split('T')[1].slice(0, 5);

    // 1. Create In-App Notifications
    const patientNotification = await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        type: NotificationType.BOOKING_CONFIRMATION,
        title: `Appointment Confirmed: ${appointment.appointmentNumber}`,
        message: `Your consultation with ${appointment.doctor.user.fullName} (${appointment.doctor.specialization}) is confirmed for ${dateStr} at ${timeStr} UTC.`,
        metadata: { appointmentId },
      },
    });

    const doctorNotification = await prisma.notification.create({
      data: {
        userId: appointment.doctor.userId,
        type: NotificationType.BOOKING_CONFIRMATION,
        title: `New Consultation Booked: ${appointment.appointmentNumber}`,
        message: `Patient ${appointment.patient.user.fullName} has booked an appointment for ${dateStr} at ${timeStr} UTC.`,
        metadata: { appointmentId },
      },
    });

    // 2. Dispatch Email to Patient
    const patientHtml = renderBookingConfirmationEmail({
      recipientName: appointment.patient.user.fullName,
      isDoctor: false,
      patientName: appointment.patient.user.fullName,
      doctorName: appointment.doctor.user.fullName,
      specialization: appointment.doctor.specialization,
      appointmentNumber: appointment.appointmentNumber,
      dateStr,
      timeStr,
      chiefComplaint: appointment.symptomSubmission?.chiefComplaint,
      frontendUrl: env.FRONTEND_URL,
    });

    await this.dispatchEmail({
      recipientEmail: appointment.patient.user.email,
      subject: `Appointment Confirmed: ${appointment.appointmentNumber} with ${appointment.doctor.user.fullName}`,
      html: patientHtml,
      templateName: 'bookingConfirmation_patient',
      notificationId: patientNotification.id,
    });

    // 3. Dispatch Email to Doctor
    const doctorHtml = renderBookingConfirmationEmail({
      recipientName: appointment.doctor.user.fullName,
      isDoctor: true,
      patientName: appointment.patient.user.fullName,
      doctorName: appointment.doctor.user.fullName,
      specialization: appointment.doctor.specialization,
      appointmentNumber: appointment.appointmentNumber,
      dateStr,
      timeStr,
      chiefComplaint: appointment.symptomSubmission?.chiefComplaint,
      frontendUrl: env.FRONTEND_URL,
    });

    await this.dispatchEmail({
      recipientEmail: appointment.doctor.user.email,
      subject: `New Appointment Booked: ${appointment.appointmentNumber} - ${appointment.patient.user.fullName}`,
      html: doctorHtml,
      templateName: 'bookingConfirmation_doctor',
      notificationId: doctorNotification.id,
    });
  }

  async sendCancellationNotification(appointmentId: string, reason: string, cancelledBy: string) {
    const appointment = await this.appointmentRepo.findAppointmentById(appointmentId);
    if (!appointment) return;

    const dateStr = appointment.slotStartTime.toISOString().split('T')[0];
    const timeStr = appointment.slotStartTime.toISOString().split('T')[1].slice(0, 5);

    // In-App Notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: appointment.patient.userId,
          type: NotificationType.APPOINTMENT_CANCELLED,
          title: `Appointment Cancelled: ${appointment.appointmentNumber}`,
          message: `Your appointment on ${dateStr} was cancelled by ${cancelledBy}. Reason: ${reason}`,
          metadata: { appointmentId, reason },
        },
        {
          userId: appointment.doctor.userId,
          type: NotificationType.APPOINTMENT_CANCELLED,
          title: `Appointment Cancelled: ${appointment.appointmentNumber}`,
          message: `Appointment on ${dateStr} with ${appointment.patient.user.fullName} was cancelled by ${cancelledBy}. Reason: ${reason}`,
          metadata: { appointmentId, reason },
        },
      ],
    });

    const emailHtml = renderCancellationEmail({
      recipientName: appointment.patient.user.fullName,
      appointmentNumber: appointment.appointmentNumber,
      doctorName: appointment.doctor.user.fullName,
      patientName: appointment.patient.user.fullName,
      dateStr,
      timeStr,
      reason,
      cancelledBy,
      frontendUrl: env.FRONTEND_URL,
    });

    await this.dispatchEmail({
      recipientEmail: appointment.patient.user.email,
      subject: `Appointment Cancelled: ${appointment.appointmentNumber}`,
      html: emailHtml,
      templateName: 'appointmentCancelled',
    });
  }

  async sendRescheduleNotification(appointmentId: string, reason?: string) {
    const appointment = await this.appointmentRepo.findAppointmentById(appointmentId);
    if (!appointment) return;

    const dateStr = appointment.slotStartTime.toISOString().split('T')[0];
    const timeStr = appointment.slotStartTime.toISOString().split('T')[1].slice(0, 5);

    await prisma.notification.createMany({
      data: [
        {
          userId: appointment.patient.userId,
          type: NotificationType.APPOINTMENT_RESCHEDULED,
          title: `Appointment Rescheduled: ${appointment.appointmentNumber}`,
          message: `Your appointment is now scheduled for ${dateStr} at ${timeStr} UTC.`,
          metadata: { appointmentId },
        },
        {
          userId: appointment.doctor.userId,
          type: NotificationType.APPOINTMENT_RESCHEDULED,
          title: `Appointment Rescheduled: ${appointment.appointmentNumber}`,
          message: `Consultation with ${appointment.patient.user.fullName} moved to ${dateStr} at ${timeStr} UTC.`,
          metadata: { appointmentId },
        },
      ],
    });

    const emailHtml = renderRescheduleEmail({
      recipientName: appointment.patient.user.fullName,
      appointmentNumber: appointment.appointmentNumber,
      doctorName: appointment.doctor.user.fullName,
      patientName: appointment.patient.user.fullName,
      newDateStr: dateStr,
      newTimeStr: timeStr,
      reason,
      frontendUrl: env.FRONTEND_URL,
    });

    await this.dispatchEmail({
      recipientEmail: appointment.patient.user.email,
      subject: `Appointment Rescheduled: ${appointment.appointmentNumber}`,
      html: emailHtml,
      templateName: 'appointmentRescheduled',
    });
  }

  async sendDoctorLeaveAlert(appointment: any, leaveReason?: string) {
    const dateStr = appointment.slotStartTime.toISOString().split('T')[0];
    const timeStr = appointment.slotStartTime.toISOString().split('T')[1].slice(0, 5);

    const notification = await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        type: NotificationType.DOCTOR_LEAVE_ALERT,
        title: `Doctor on Leave - Reschedule Required: ${appointment.appointmentNumber}`,
        message: `Dr. ${appointment.doctor.user.fullName} will be on leave on ${dateStr}. Please choose a new appointment slot.`,
        metadata: { appointmentId: appointment.id, leaveReason },
      },
    });

    const emailHtml = renderDoctorLeaveAlertEmail({
      patientName: appointment.patient.user.fullName,
      doctorName: appointment.doctor.user.fullName,
      specialization: appointment.doctor.specialization,
      appointmentNumber: appointment.appointmentNumber,
      dateStr,
      timeStr,
      leaveReason,
      frontendUrl: env.FRONTEND_URL,
    });

    await this.dispatchEmail({
      recipientEmail: appointment.patient.user.email,
      subject: `Important: Reschedule Required for Appointment ${appointment.appointmentNumber}`,
      html: emailHtml,
      templateName: 'doctorLeaveAlert',
      notificationId: notification.id,
    });
  }
}

export const emailService = new EmailService();
