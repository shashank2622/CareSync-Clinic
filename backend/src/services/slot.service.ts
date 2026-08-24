import { slotRepository, SlotRepository } from '../repositories/slot.repository.js';
import { AppError } from '../utils/app-error.js';
import {
  timeStringToMinutes,
  minutesToTimeString,
  createSlotDateTime,
  isSlotDuringBreak,
} from '../utils/datetime.js';

export interface GeneratedSlot {
  startTime: string; // "09:00"
  endTime: string;   // "09:30"
  slotStartTime: Date;
  slotEndTime: Date;
  isAvailable: boolean;
  status: 'AVAILABLE' | 'BOOKED' | 'HELD' | 'BREAK' | 'IN_PAST';
  isHeldByYou?: boolean;
  holdToken?: string;
  holdExpiresAt?: Date;
  remainingHoldSeconds?: number;
}

export class SlotService {
  constructor(private repo: SlotRepository = slotRepository) {}

  async getDoctorAvailability(
    doctorId: string,
    dateStr: string,
    currentPatientId?: string
  ) {
    const doctor = await this.repo.getDoctorWithSchedule(doctorId);
    if (!doctor || !doctor.user.isActive) {
      throw AppError.notFound('Doctor profile not found or is currently inactive');
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)); // Noon UTC for leave query
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // 1. Check if Doctor is on Approved Leave
    const leave = await this.repo.getDoctorLeavesForDate(doctorId, targetDate);
    if (leave) {
      return {
        doctorId: doctor.id,
        doctorName: doctor.user.fullName,
        date: dateStr,
        isAvailable: false,
        reason: 'DOCTOR_ON_LEAVE',
        message: `Doctor is on leave: ${leave.reason || 'Personal leave'}`,
        slots: [],
      };
    }

    // 2. Check Doctor's Working Hours for Day of Week (0 = Sun, ..., 6 = Sat)
    const dayOfWeek = targetDate.getUTCDay();
    const workingHour = doctor.workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);

    if (!workingHour || !workingHour.isAvailable) {
      return {
        doctorId: doctor.id,
        doctorName: doctor.user.fullName,
        date: dateStr,
        isAvailable: false,
        reason: 'NOT_WORKING_DAY',
        message: 'Doctor is not scheduled to work on this day',
        slots: [],
      };
    }

    // 3. Fetch Active Appointments & Holds
    const [appointments, activeHolds] = await Promise.all([
      this.repo.getActiveAppointmentsForDate(doctorId, startOfDay, endOfDay),
      this.repo.getActiveSlotHoldsForDate(doctorId, startOfDay, endOfDay),
    ]);

    const slotDuration = doctor.slotDurationMinutes || 30;
    const shiftStartMin = timeStringToMinutes(workingHour.startTime);
    const shiftEndMin = timeStringToMinutes(workingHour.endTime);
    const now = new Date();

    const slots: GeneratedSlot[] = [];

    // 4. Generate Slots
    for (let currentMin = shiftStartMin; currentMin + slotDuration <= shiftEndMin; currentMin += slotDuration) {
      const slotStartTimeStr = minutesToTimeString(currentMin);
      const slotEndTimeStr = minutesToTimeString(currentMin + slotDuration);

      const slotStartDateTime = createSlotDateTime(dateStr, slotStartTimeStr);
      const slotEndDateTime = createSlotDateTime(dateStr, slotEndTimeStr);

      // Check if slot falls during lunch / break
      const isBreak = isSlotDuringBreak(
        currentMin,
        currentMin + slotDuration,
        workingHour.breakStartTime,
        workingHour.breakEndTime
      );

      if (isBreak) {
        slots.push({
          startTime: slotStartTimeStr,
          endTime: slotEndTimeStr,
          slotStartTime: slotStartDateTime,
          slotEndTime: slotEndDateTime,
          isAvailable: false,
          status: 'BREAK',
        });
        continue;
      }

      // Check if slot is in the past
      if (slotStartDateTime < now) {
        slots.push({
          startTime: slotStartTimeStr,
          endTime: slotEndTimeStr,
          slotStartTime: slotStartDateTime,
          slotEndTime: slotEndDateTime,
          isAvailable: false,
          status: 'IN_PAST',
        });
        continue;
      }

      // Check if slot is already booked (confirmed appointment)
      const matchingAppointment = appointments.find(
        (apt) => apt.slotStartTime.getTime() === slotStartDateTime.getTime()
      );

      if (matchingAppointment) {
        slots.push({
          startTime: slotStartTimeStr,
          endTime: slotEndTimeStr,
          slotStartTime: slotStartDateTime,
          slotEndTime: slotEndDateTime,
          isAvailable: false,
          status: 'BOOKED',
        });
        continue;
      }

      // Check if slot is currently held
      const matchingHold = activeHolds.find(
        (hold) => hold.slotStartTime.getTime() === slotStartDateTime.getTime()
      );

      if (matchingHold) {
        const isHeldByYou = currentPatientId ? matchingHold.patientId === currentPatientId : false;
        const remainingSeconds = Math.max(0, Math.floor((matchingHold.expiresAt.getTime() - now.getTime()) / 1000));

        slots.push({
          startTime: slotStartTimeStr,
          endTime: slotEndTimeStr,
          slotStartTime: slotStartDateTime,
          slotEndTime: slotEndDateTime,
          isAvailable: isHeldByYou, // if held by current user, user can continue to book
          status: 'HELD',
          isHeldByYou,
          holdToken: isHeldByYou ? matchingHold.holdToken : undefined,
          holdExpiresAt: matchingHold.expiresAt,
          remainingHoldSeconds: isHeldByYou ? remainingSeconds : undefined,
        });
        continue;
      }

      // Slot is completely open and available
      slots.push({
        startTime: slotStartTimeStr,
        endTime: slotEndTimeStr,
        slotStartTime: slotStartDateTime,
        slotEndTime: slotEndDateTime,
        isAvailable: true,
        status: 'AVAILABLE',
      });
    }

    const availableSlotsCount = slots.filter((s) => s.isAvailable).length;

    return {
      doctorId: doctor.id,
      doctorName: doctor.user.fullName,
      specialization: doctor.specialization,
      consultationFee: doctor.consultationFee,
      date: dateStr,
      isAvailable: availableSlotsCount > 0,
      slotDurationMinutes: slotDuration,
      totalSlots: slots.length,
      availableSlotsCount,
      slots,
    };
  }

  async getMonthAvailableDates(doctorId: string, monthStr: string) {
    const doctor = await this.repo.getDoctorWithSchedule(doctorId);
    if (!doctor || !doctor.user.isActive) {
      throw AppError.notFound('Doctor profile not found or is currently inactive');
    }

    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59)); // Last day of month

    const leaves = await this.repo.getDoctorLeavesForDateRange(doctorId, startDate, endDate);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const availableDates: { date: string; hasSlots: boolean; dayOfWeek: number }[] = [];
    const totalDays = endDate.getUTCDate();

    for (let day = 1; day <= totalDays; day++) {
      const currentDay = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      // Skip past dates
      if (currentDay < today) {
        availableDates.push({ date: dateString, hasSlots: false, dayOfWeek: currentDay.getUTCDay() });
        continue;
      }

      // Check leave
      const onLeave = leaves.some(
        (l) => l.startDate <= currentDay && l.endDate >= currentDay
      );

      if (onLeave) {
        availableDates.push({ date: dateString, hasSlots: false, dayOfWeek: currentDay.getUTCDay() });
        continue;
      }

      // Check working hours
      const dayOfWeek = currentDay.getUTCDay();
      const workingHour = doctor.workingHours.find((wh) => wh.dayOfWeek === dayOfWeek && wh.isAvailable);

      availableDates.push({
        date: dateString,
        hasSlots: !!workingHour,
        dayOfWeek,
      });
    }

    return {
      doctorId: doctor.id,
      month: monthStr,
      dates: availableDates,
    };
  }
}

export const slotService = new SlotService();
