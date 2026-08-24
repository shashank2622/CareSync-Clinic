import { appointmentRepository, AppointmentRepository } from '../repositories/appointment.repository.js';
import { slotRepository, SlotRepository } from '../repositories/slot.repository.js';
import { doctorRepository, DoctorRepository } from '../repositories/doctor.repository.js';
import { userRepository, UserRepository } from '../repositories/user.repository.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import {
  CreateHoldInput,
  ConfirmAppointmentInput,
  RescheduleAppointmentInput,
  CancelAppointmentInput,
  AppointmentQueryInput,
} from '../validators/appointment.validator.js';
import { AuthenticatedUser } from '../types/auth.types.js';
import { AppointmentStatus, HoldStatus, Role, Prisma } from '@prisma/client';
import { isSlotDuringBreak, timeStringToMinutes } from '../utils/datetime.js';

export class AppointmentService {
  constructor(
    private appointmentRepo: AppointmentRepository = appointmentRepository,
    private slotRepo: SlotRepository = slotRepository,
    private doctorRepo: DoctorRepository = doctorRepository,
    private userRepo: UserRepository = userRepository
  ) {}

  private generateAppointmentNumber(): string {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `APT-${todayStr}-${randomSuffix}`;
  }

  async createSlotHold(input: CreateHoldInput, patientId: string) {
    const doctor = await this.doctorRepo.findDoctorById(input.doctorId);
    if (!doctor || !doctor.user.isActive) {
      throw AppError.notFound('Doctor profile not found or is currently inactive');
    }

    const slotStart = new Date(input.slotStartTime);
    const slotEnd = new Date(input.slotEndTime);
    const now = new Date();

    if (slotStart < now) {
      throw AppError.badRequest('Cannot hold a slot in the past');
    }

    // 1. Check if Doctor is on Leave
    const leave = await this.slotRepo.getDoctorLeavesForDate(input.doctorId, slotStart);
    if (leave) {
      throw AppError.conflict('Doctor is on leave on this date', 'DOCTOR_ON_LEAVE');
    }

    // 2. Check Doctor's Working Hours & Breaks
    const dayOfWeek = slotStart.getUTCDay();
    const workingHour = doctor.workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);

    if (!workingHour || !workingHour.isAvailable) {
      throw AppError.badRequest('Doctor is not available for appointments on this day of the week');
    }

    const startMinutes = slotStart.getUTCHours() * 60 + slotStart.getUTCMinutes();
    const endMinutes = slotEnd.getUTCHours() * 60 + slotEnd.getUTCMinutes();
    const shiftStartMin = timeStringToMinutes(workingHour.startTime);
    const shiftEndMin = timeStringToMinutes(workingHour.endTime);

    if (startMinutes < shiftStartMin || endMinutes > shiftEndMin) {
      throw AppError.badRequest(`Requested slot falls outside doctor's shift (${workingHour.startTime} - ${workingHour.endTime})`);
    }

    if (isSlotDuringBreak(startMinutes, endMinutes, workingHour.breakStartTime, workingHour.breakEndTime)) {
      throw AppError.badRequest(`Requested slot falls during doctor's break (${workingHour.breakStartTime} - ${workingHour.breakEndTime})`);
    }

    // 3. Check for Existing Confirmed Booking
    const booked = await this.appointmentRepo.findConflictingAppointment(input.doctorId, slotStart);
    if (booked) {
      throw AppError.slotAlreadyBooked('This slot has already been booked by another patient.');
    }

    // 4. Check for Existing Active Slot Hold
    const activeHold = await this.appointmentRepo.findActiveHoldForSlot(input.doctorId, slotStart);
    if (activeHold) {
      if (activeHold.patientId === patientId) {
        // Return existing active hold for the same user
        const remainingSeconds = Math.max(0, Math.floor((activeHold.expiresAt.getTime() - now.getTime()) / 1000));
        return {
          holdToken: activeHold.holdToken,
          expiresAt: activeHold.expiresAt,
          remainingSeconds,
          doctorId: activeHold.doctorId,
          slotStartTime: activeHold.slotStartTime,
          slotEndTime: activeHold.slotEndTime,
        };
      } else {
        throw AppError.conflict('This slot is currently being held by another patient. Please choose a different slot.', 'SLOT_ALREADY_BOOKED');
      }
    }

    // 5. Create New 5-Minute Hold
    const holdDurationMinutes = env.SLOT_HOLD_DURATION_MINUTES || 5;
    const expiresAt = new Date(now.getTime() + holdDurationMinutes * 60 * 1000);

    const hold = await this.appointmentRepo.createHold({
      doctorId: input.doctorId,
      patientId,
      slotStartTime: slotStart,
      slotEndTime: slotEnd,
      expiresAt,
    });

    return {
      holdToken: hold.holdToken,
      expiresAt: hold.expiresAt,
      remainingSeconds: holdDurationMinutes * 60,
      doctorId: hold.doctorId,
      slotStartTime: hold.slotStartTime,
      slotEndTime: hold.slotEndTime,
    };
  }

  async releaseSlotHold(holdToken: string, patientId: string) {
    await this.appointmentRepo.releaseHold(holdToken, patientId);
    return { success: true, message: 'Slot hold released' };
  }

  async confirmAppointment(input: ConfirmAppointmentInput, patientId: string) {
    const hold = await this.appointmentRepo.findHoldByToken(input.holdToken);

    if (!hold) {
      throw AppError.badRequest('Invalid or unrecognized slot hold token');
    }

    if (hold.patientId !== patientId) {
      throw AppError.forbidden('This slot hold belongs to a different patient account');
    }

    if (hold.status !== HoldStatus.HELD || hold.expiresAt <= new Date()) {
      throw AppError.slotHoldExpired();
    }

    const appointmentNumber = this.generateAppointmentNumber();

    try {
      const appointment = await this.appointmentRepo.createAppointmentTransaction({
        appointmentNumber,
        doctorId: hold.doctorId,
        patientId: hold.patientId,
        slotHoldId: hold.id,
        slotStartTime: hold.slotStartTime,
        slotEndTime: hold.slotEndTime,
        symptoms: input.chiefComplaint
          ? {
              chiefComplaint: input.chiefComplaint,
              symptomsText: input.symptomsText || input.chiefComplaint,
              duration: input.duration,
              severity: input.severity,
              additionalNotes: input.additionalNotes,
            }
          : undefined,
      });

      return appointment;
    } catch (err: any) {
      if (err.message === 'SLOT_ALREADY_BOOKED') {
        throw AppError.slotAlreadyBooked();
      }
      if (err.message === 'SLOT_HOLD_EXPIRED') {
        throw AppError.slotHoldExpired();
      }
      throw err;
    }
  }

  async getAppointments(user: AuthenticatedUser, query: AppointmentQueryInput) {
    const { status, startDate, endDate, doctorId, patientId, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {};

    // Enforce RBAC filtering
    if (user.role === Role.PATIENT) {
      if (!user.patientProfile) throw AppError.forbidden('Patient profile not initialized');
      where.patientId = user.patientProfile.id;
    } else if (user.role === Role.DOCTOR) {
      if (!user.doctorProfile) throw AppError.forbidden('Doctor profile not initialized');
      where.doctorId = user.doctorProfile.id;
    } else if (user.role === Role.ADMIN) {
      if (doctorId) where.doctorId = doctorId;
      if (patientId) where.patientId = patientId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.slotStartTime = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const { total, appointments } = await this.appointmentRepo.findAppointments(where, skip, limit);

    return {
      appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAppointmentById(id: string, user: AuthenticatedUser) {
    const appointment = await this.appointmentRepo.findAppointmentById(id);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    // RBAC check
    if (user.role === Role.PATIENT && appointment.patientId !== user.patientProfile?.id) {
      throw AppError.forbidden('You do not have permission to view this appointment');
    }
    if (user.role === Role.DOCTOR && appointment.doctorId !== user.doctorProfile?.id) {
      throw AppError.forbidden('You do not have permission to view this appointment');
    }

    return appointment;
  }

  async cancelAppointment(id: string, input: CancelAppointmentInput, user: AuthenticatedUser) {
    const appointment = await this.appointmentRepo.findAppointmentById(id);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    // RBAC check
    if (user.role === Role.PATIENT && appointment.patientId !== user.patientProfile?.id) {
      throw AppError.forbidden('You can only cancel your own appointments');
    }
    if (user.role === Role.DOCTOR && appointment.doctorId !== user.doctorProfile?.id) {
      throw AppError.forbidden('You can only cancel appointments scheduled with you');
    }

    if (
      appointment.status === AppointmentStatus.CANCELLED_BY_PATIENT ||
      appointment.status === AppointmentStatus.CANCELLED_BY_DOCTOR ||
      appointment.status === AppointmentStatus.CANCELLED_BY_ADMIN ||
      appointment.status === AppointmentStatus.CANCELLED_DOCTOR_LEAVE
    ) {
      throw AppError.badRequest('This appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw AppError.badRequest('Completed appointments cannot be cancelled');
    }

    let newStatus: AppointmentStatus = AppointmentStatus.CANCELLED_BY_PATIENT;
    if (user.role === Role.DOCTOR) newStatus = AppointmentStatus.CANCELLED_BY_DOCTOR;
    if (user.role === Role.ADMIN) newStatus = AppointmentStatus.CANCELLED_BY_ADMIN;

    const updated = await this.appointmentRepo.updateAppointmentStatus(
      id,
      newStatus,
      input.reason
    );

    return updated;
  }

  async rescheduleAppointment(id: string, input: RescheduleAppointmentInput, user: AuthenticatedUser) {
    const appointment = await this.appointmentRepo.findAppointmentById(id);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    if (user.role === Role.PATIENT && appointment.patientId !== user.patientProfile?.id) {
      throw AppError.forbidden('You can only reschedule your own appointments');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw AppError.badRequest('Completed appointments cannot be rescheduled');
    }

    const newHold = await this.appointmentRepo.findHoldByToken(input.newHoldToken);
    if (!newHold) {
      throw AppError.badRequest('Invalid new slot hold token');
    }

    if (newHold.patientId !== appointment.patientId) {
      throw AppError.forbidden('The new slot hold does not belong to this patient');
    }

    if (newHold.doctorId !== appointment.doctorId) {
      throw AppError.badRequest('Rescheduling must be with the same doctor');
    }

    if (newHold.status !== HoldStatus.HELD || newHold.expiresAt <= new Date()) {
      throw AppError.slotHoldExpired();
    }

    const updated = await this.appointmentRepo.rescheduleAppointmentTransaction(
      id,
      newHold.id,
      newHold.slotStartTime,
      newHold.slotEndTime,
      input.reason
    );

    return updated;
  }
}

export const appointmentService = new AppointmentService();
