import { z } from 'zod';

export const createLeaveSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  reason: z.string().min(3, 'Reason is required (min 3 characters)').trim(),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'Start date cannot be after end date',
    path: ['startDate'],
  }
);

export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
