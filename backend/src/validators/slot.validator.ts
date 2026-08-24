import { z } from 'zod';

export const availabilityQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format (e.g. 2026-08-25)')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid calendar date'),
});

export const monthAvailabilityQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format (e.g. 2026-08)'),
});

export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
export type MonthAvailabilityQueryInput = z.infer<typeof monthAvailabilityQuerySchema>;
