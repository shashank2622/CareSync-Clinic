import { prisma } from '../config/database.js';
import { AppointmentStatus, HoldStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';

export class AppointmentRepository {
  async findHoldByToken(holdToken: string) {
    return prisma.slotHold.findUnique({
      where: { holdToken },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        patient: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async createHold(data: {
    doctorId: string;
    patientId: string;
    slotStartTime: Date;
    slotEndTime: Date;
    expiresAt: Date;
  }) {
    const holdToken = crypto.randomUUID();
    return prisma.slotHold.create({
      data: {
        doctorId: data.doctorId,
        patientId: data.patientId,
        slotStartTime: data.slotStartTime,
        slotEndTime: data.slotEndTime,
        expiresAt: data.expiresAt,
        status: HoldStatus.HELD,
        holdToken,
      },
    });
  }

  async releaseHold(holdToken: string, patientId: string) {
    return prisma.slotHold.updateMany({
      where: {
        holdToken,
        patientId,
        status: HoldStatus.HELD,
      },
      data: {
        status: HoldStatus.RELEASED,
      },
    });
  }

  async findActiveHoldForSlot(doctorId: string, slotStartTime: Date) {
    const now = new Date();
    return prisma.slotHold.findFirst({
      where: {
        doctorId,
        slotStartTime,
        status: HoldStatus.HELD,
        expiresAt: { gt: now },
      },
    });
  }

  async findConflictingAppointment(doctorId: string, slotStartTime: Date) {
    return prisma.appointment.findFirst({
      where: {
        doctorId,
        slotStartTime,
        status: {
          notIn: [
            AppointmentStatus.CANCELLED_BY_PATIENT,
            AppointmentStatus.CANCELLED_BY_DOCTOR,
            AppointmentStatus.CANCELLED_BY_ADMIN,
            AppointmentStatus.CANCELLED_DOCTOR_LEAVE,
          ],
        },
      },
    });
  }

  async createAppointmentTransaction(data: {
    appointmentNumber: string;
    doctorId: string;
    patientId: string;
    slotHoldId: string;
    slotStartTime: Date;
    slotEndTime: Date;
    symptoms?: {
      chiefComplaint: string;
      symptomsText: string;
      duration?: string;
      severity?: number;
      additionalNotes?: string;
    };
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Re-verify hold within transaction
      const hold = await tx.slotHold.findUnique({
        where: { id: data.slotHoldId },
      });

      if (!hold || hold.status !== HoldStatus.HELD || hold.expiresAt < new Date()) {
        throw new Error('SLOT_HOLD_EXPIRED');
      }

      // 2. Check for double booking collision inside transaction
      const conflict = await tx.appointment.findFirst({
        where: {
          doctorId: data.doctorId,
          slotStartTime: data.slotStartTime,
          status: {
            notIn: [
              AppointmentStatus.CANCELLED_BY_PATIENT,
              AppointmentStatus.CANCELLED_BY_DOCTOR,
              AppointmentStatus.CANCELLED_BY_ADMIN,
              AppointmentStatus.CANCELLED_DOCTOR_LEAVE,
            ],
          },
        },
      });

      if (conflict) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      // 3. Mark Hold as CONVERTED
      await tx.slotHold.update({
        where: { id: data.slotHoldId },
        data: { status: HoldStatus.CONVERTED },
      });

      // 4. Create Confirmed Appointment
      const appointment = await tx.appointment.create({
        data: {
          appointmentNumber: data.appointmentNumber,
          doctorId: data.doctorId,
          patientId: data.patientId,
          slotHoldId: data.slotHoldId,
          slotStartTime: data.slotStartTime,
          slotEndTime: data.slotEndTime,
          status: AppointmentStatus.CONFIRMED,
          ...(data.symptoms
            ? {
                symptomSubmission: {
                  create: {
                    chiefComplaint: data.symptoms.chiefComplaint,
                    symptomsText: data.symptoms.symptomsText,
                    duration: data.symptoms.duration || 'Not specified',
                    severity: data.symptoms.severity || 5,
                    additionalNotes: data.symptoms.additionalNotes,
                  },
                },
              }
            : {}),
        },
        include: {
          doctor: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true, phone: true },
              },
            },
          },
          patient: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true, phone: true },
              },
            },
          },
          symptomSubmission: true,
          preVisitSummary: true,
          visitNote: true,
          prescription: {
            include: {
              medications: true,
            },
          },
          calendarEvent: true,
        },
      });

      return appointment;
    });
  }

  async findAppointmentById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
            },
          },
        },
        symptomSubmission: true,
        preVisitSummary: true,
        visitNote: true,
        prescription: {
          include: {
            medications: {
              include: {
                reminders: true,
              },
            },
          },
        },
        calendarEvent: true,
      },
    });
  }

  async findAppointments(
    where: Prisma.AppointmentWhereInput,
    skip: number,
    take: number
  ) {
    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip,
        take,
        include: {
          doctor: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true, phone: true },
              },
            },
          },
          patient: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true, phone: true },
              },
            },
          },
          symptomSubmission: true,
          preVisitSummary: {
            select: {
              id: true,
              urgencyLevel: true,
              status: true,
            },
          },
          visitNote: {
            select: {
              id: true,
              diagnosis: true,
            },
          },
          prescription: {
            select: {
              id: true,
              aiStatus: true,
            },
          },
        },
        orderBy: { slotStartTime: 'desc' },
      }),
    ]);

    return { total, appointments };
  }

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    cancellationReason?: string
  ) {
    return prisma.appointment.update({
      where: { id },
      data: {
        status,
        cancellationReason,
      },
      include: {
        doctor: {
          include: { user: true },
        },
        patient: {
          include: { user: true },
        },
        calendarEvent: true,
      },
    });
  }

  async rescheduleAppointmentTransaction(
    appointmentId: string,
    newHoldId: string,
    newSlotStart: Date,
    newSlotEnd: Date,
    reason?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Mark new hold as converted
      await tx.slotHold.update({
        where: { id: newHoldId },
        data: { status: HoldStatus.CONVERTED },
      });

      // 2. Update existing appointment with new slot
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          slotHoldId: newHoldId,
          slotStartTime: newSlotStart,
          slotEndTime: newSlotEnd,
          status: AppointmentStatus.CONFIRMED,
          cancellationReason: reason ? `Rescheduled: ${reason}` : 'Rescheduled by patient',
        },
        include: {
          doctor: {
            include: { user: true },
          },
          patient: {
            include: { user: true },
          },
          calendarEvent: true,
        },
      });

      return updated;
    });
  }
}

export const appointmentRepository = new AppointmentRepository();
