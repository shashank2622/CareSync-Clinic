import { prisma } from '../config/database.js';
import { AppointmentStatus, HoldStatus } from '@prisma/client';

export class SlotRepository {
  async getDoctorWithSchedule(doctorId: string) {
    return prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            isActive: true,
          },
        },
        workingHours: true,
      },
    });
  }

  async getDoctorLeavesForDate(doctorId: string, targetDate: Date) {
    return prisma.doctorLeave.findFirst({
      where: {
        doctorId,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });
  }

  async getDoctorLeavesForDateRange(doctorId: string, startDate: Date, endDate: Date) {
    return prisma.doctorLeave.findMany({
      where: {
        doctorId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });
  }

  async getActiveAppointmentsForDate(doctorId: string, startOfDay: Date, endOfDay: Date) {
    return prisma.appointment.findMany({
      where: {
        doctorId,
        slotStartTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: [
            AppointmentStatus.CANCELLED_BY_PATIENT,
            AppointmentStatus.CANCELLED_BY_DOCTOR,
            AppointmentStatus.CANCELLED_BY_ADMIN,
            AppointmentStatus.CANCELLED_DOCTOR_LEAVE,
          ],
        },
      },
      select: {
        id: true,
        slotStartTime: true,
        slotEndTime: true,
        status: true,
      },
    });
  }

  async getActiveSlotHoldsForDate(doctorId: string, startOfDay: Date, endOfDay: Date) {
    const now = new Date();
    return prisma.slotHold.findMany({
      where: {
        doctorId,
        status: HoldStatus.HELD,
        expiresAt: { gt: now },
        slotStartTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        patientId: true,
        slotStartTime: true,
        slotEndTime: true,
        expiresAt: true,
        holdToken: true,
      },
    });
  }
}

export const slotRepository = new SlotRepository();
