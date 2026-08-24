import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

export const createHoldSchema = z.object({
  doctorId: z.string().uuid('Invalid Doctor ID format'),
  slotStartTime: z.string().datetime({ message: 'slotStartTime must be a valid ISO 8601 UTC timestamp' }),
  slotEndTime: z.string().datetime({ message: 'slotEndTime must be a valid ISO 8601 UTC timestamp' }),
}).refine(
  (data) => new Date(data.slotStartTime) < new Date(data.slotEndTime),
  {
    message: 'slotStartTime must be before slotEndTime',
    path: ['slotStartTime'],
  }
);

export const confirmAppointmentSchema = z.object({
  holdToken: z.string().uuid('Invalid holdToken format'),
  chiefComplaint: z.string().min(3, 'Chief complaint must be at least 3 characters').optional(),
  symptomsText: z.string().min(5, 'Symptoms description must be at least 5 characters').optional(),
  duration: z.string().optional(),
  severity: z.number().int().min(1).max(10).optional(),
  additionalNotes: z.string().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  newHoldToken: z.string().uuid('Invalid newHoldToken format'),
  reason: z.string().min(3, 'Reschedule reason must be at least 3 characters').optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason must be at least 3 characters'),
});

export const appointmentQuerySchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  page: z.string().optional().default('1').transform((v) => Math.max(1, parseInt(v, 10))),
  limit: z.string().optional().default('10').transform((v) => Math.min(50, Math.max(1, parseInt(v, 10)))),
});

export type CreateHoldInput = z.infer<typeof createHoldSchema>;
export type ConfirmAppointmentInput = z.infer<typeof confirmAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>;
