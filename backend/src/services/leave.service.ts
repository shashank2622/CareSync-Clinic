import { prisma } from '../config/database.js';
import { doctorRepository, DoctorRepository } from '../repositories/doctor.repository.js';
import { emailService, EmailService } from './email.service.js';
import { AppError } from '../utils/app-error.js';
import { CreateLeaveInput } from '../validators/leave.validator.js';
import { AuthenticatedUser } from '../types/auth.types.js';
import { AppointmentStatus } from '@prisma/client';
import { logger } from '../utils/logger.js';

export class LeaveService {
  constructor(
    private doctorRepo: DoctorRepository = doctorRepository,
    private email: EmailService = emailService
  ) {}

  async createDoctorLeave(doctorId: string, input: CreateLeaveInput, adminUser: AuthenticatedUser) {
    const doctor = await this.doctorRepo.findDoctorById(doctorId);
    if (!doctor || !doctor.user.isActive) {
      throw AppError.notFound('Doctor profile not found or is currently inactive');
    }

    const [startYear, startMonth, startDay] = input.startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = input.endDate.split('-').map(Number);

    const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));

    // Execute atomic transaction for leave and affected appointment updates
    const { leave, affectedAppointments } = await prisma.$transaction(async (tx) => {
      // 1. Create Doctor Leave
      const newLeave = await tx.doctorLeave.create({
        data: {
          doctorId,
          startDate,
          endDate,
          reason: input.reason,
          approvedById: adminUser.id,
        },
      });

      // 2. Find active overlapping appointments
      const conflictingAppointments = await tx.appointment.findMany({
        where: {
          doctorId,
          slotStartTime: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            notIn: [
              AppointmentStatus.CANCELLED_BY_PATIENT,
              AppointmentStatus.CANCELLED_BY_DOCTOR,
              AppointmentStatus.CANCELLED_BY_ADMIN,
              AppointmentStatus.CANCELLED_DOCTOR_LEAVE,
              AppointmentStatus.COMPLETED,
            ],
          },
        },
        include: {
          doctor: {
            include: { user: true },
          },
          patient: {
            include: { user: true },
          },
        },
      });

      // 3. Mark conflicting appointments as CANCELLED_DOCTOR_LEAVE (never hard delete)
      if (conflictingAppointments.length > 0) {
        await tx.appointment.updateMany({
          where: {
            id: { in: conflictingAppointments.map((a) => a.id) },
          },
          data: {
            status: AppointmentStatus.CANCELLED_DOCTOR_LEAVE,
            cancellationReason: `Doctor marked on leave: ${input.reason}`,
          },
        });
      }

      return {
        leave: newLeave,
        affectedAppointments: conflictingAppointments,
      };
    });

    logger.info(
      `📅 Scheduled leave for Dr. ${doctor.user.fullName} (${input.startDate} to ${input.endDate}). Impacted ${affectedAppointments.length} appointment(s).`
    );

    // 4. Asynchronously notify affected patients with 1-click reschedule link
    for (const apt of affectedAppointments) {
      this.email.sendDoctorLeaveAlert(apt, input.reason).catch((err) => {
        logger.warn(`Failed to send doctor leave alert for appointment ${apt.id}: ${err.message}`);
      });
    }

    return {
      leave,
      affectedCount: affectedAppointments.length,
      affectedAppointments: affectedAppointments.map((a) => ({
        id: a.id,
        appointmentNumber: a.appointmentNumber,
        patientName: a.patient.user.fullName,
        patientEmail: a.patient.user.email,
        slotStartTime: a.slotStartTime,
      })),
    };
  }

  async getDoctorLeaves(doctorId: string) {
    const doctor = await this.doctorRepo.findDoctorById(doctorId);
    if (!doctor) {
      throw AppError.notFound('Doctor profile not found');
    }

    return prisma.doctorLeave.findMany({
      where: { doctorId },
      include: {
        approvedBy: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async deleteDoctorLeave(leaveId: string, doctorId: string) {
    const leave = await prisma.doctorLeave.findUnique({
      where: { id: leaveId },
    });

    if (!leave || leave.doctorId !== doctorId) {
      throw AppError.notFound('Doctor leave record not found');
    }

    await prisma.doctorLeave.delete({
      where: { id: leaveId },
    });

    return { success: true, message: 'Doctor leave record removed successfully' };
  }
}

export const leaveService = new LeaveService();
