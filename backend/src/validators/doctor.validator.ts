import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm format (00:00 to 23:59)

export const createDoctorSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
  phone: z.string().optional(),
  specialization: z.string().min(2, 'Specialization is required').trim(),
  licenseNumber: z.string().min(2, 'Medical license number is required').trim(),
  experienceYears: z.number().int().min(0, 'Experience years must be non-negative').default(1),
  bio: z.string().optional(),
  consultationFee: z.number().positive('Consultation fee must be positive').default(50.00),
  slotDurationMinutes: z.number().int().min(10).max(120).default(30),
});

export const updateDoctorSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  specialization: z.string().min(2).optional(),
  licenseNumber: z.string().min(2).optional(),
  experienceYears: z.number().int().min(0).optional(),
  bio: z.string().optional(),
  consultationFee: z.number().positive().optional(),
  slotDurationMinutes: z.number().int().min(10).max(120).optional(),
  isActive: z.boolean().optional(),
});

export const workingHourItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format (e.g. 09:00)'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format (e.g. 17:00)'),
  isAvailable: z.boolean().default(true),
  breakStartTime: z.string().regex(timeRegex, 'Break start time must be in HH:mm format').optional().nullable(),
  breakEndTime: z.string().regex(timeRegex, 'Break end time must be in HH:mm format').optional().nullable(),
}).refine(
  (data) => {
    if (!data.isAvailable) return true;
    return data.startTime < data.endTime;
  },
  {
    message: 'Start time must be before end time',
    path: ['startTime'],
  }
).refine(
  (data) => {
    if (!data.isAvailable || !data.breakStartTime || !data.breakEndTime) return true;
    return (
      data.breakStartTime < data.breakEndTime &&
      data.breakStartTime > data.startTime &&
      data.breakEndTime < data.endTime
    );
  },
  {
    message: 'Break period must be within working hours (breakStart < breakEnd, and between shift start and end)',
    path: ['breakStartTime'],
  }
);

export const setWorkingHoursSchema = z.object({
  workingHours: z.array(workingHourItemSchema).min(1, 'At least one day working schedule is required'),
});

export const doctorQuerySchema = z.object({
  specialization: z.string().optional(),
  search: z.string().optional(),
  minExperience: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  maxFee: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
  page: z.string().optional().default('1').transform((v) => Math.max(1, parseInt(v, 10))),
  limit: z.string().optional().default('10').transform((v) => Math.min(50, Math.max(1, parseInt(v, 10)))),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type SetWorkingHoursInput = z.infer<typeof setWorkingHoursSchema>;
export type DoctorQueryInput = z.infer<typeof doctorQuerySchema>;
