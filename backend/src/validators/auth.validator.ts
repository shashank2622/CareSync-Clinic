import { z } from 'zod';
import { Gender } from '@prisma/client';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
  phone: z.string().optional(),
  dob: z.string().optional(), // YYYY-MM-DD format
  gender: z.nativeEnum(Gender).optional().default(Gender.PREFER_NOT_TO_SAY),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalHistorySummary: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  // Patient fields
  dob: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalHistorySummary: z.string().optional(),
  // Doctor fields
  bio: z.string().optional(),
  consultationFee: z.number().positive('Consultation fee must be positive').optional(),
  slotDurationMinutes: z.number().int().min(10).max(120).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
