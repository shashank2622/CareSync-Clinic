import { z } from 'zod';
import { ReminderFrequency } from '@prisma/client';

export const medicationItemSchema = z.object({
  name: z.string().min(2, 'Medication name is required').trim(),
  dosage: z.string().min(1, 'Dosage is required (e.g. 500mg, 10ml)').trim(),
  frequency: z.nativeEnum(ReminderFrequency).default(ReminderFrequency.TWICE_DAILY),
  durationDays: z.number().int().min(1).max(365).default(7),
  instructions: z.string().optional(),
  startDate: z.string().optional(), // YYYY-MM-DD
});

export const submitVisitNotesSchema = z.object({
  clinicalNotes: z.string().min(5, 'Clinical notes must be at least 5 characters').trim(),
  diagnosis: z.string().min(2, 'Diagnosis / Assessment is required').trim(),
  vitalSigns: z
    .object({
      bp: z.string().optional(), // Blood pressure (e.g. "120/80")
      hr: z.union([z.number(), z.string()]).optional(), // Heart rate bpm
      temp: z.string().optional(), // Temperature (e.g. "98.6F")
      spo2: z.string().optional(), // SpO2 oxygen saturation (e.g. "99%")
      weightKg: z.union([z.number(), z.string()]).optional(),
    })
    .optional(),
  followUpInstructions: z.string().optional(),
  nextVisitRecommendedDate: z.string().optional(), // YYYY-MM-DD
  doctorNotes: z.string().optional(),
  medications: z.array(medicationItemSchema).optional().default([]),
});

export type MedicationItemInput = z.infer<typeof medicationItemSchema>;
export type SubmitVisitNotesInput = z.infer<typeof submitVisitNotesSchema>;
