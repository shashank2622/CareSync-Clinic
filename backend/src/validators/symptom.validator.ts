import { z } from 'zod';

export const submitSymptomsSchema = z.object({
  chiefComplaint: z
    .string()
    .min(3, 'Chief complaint must be at least 3 characters')
    .max(300, 'Chief complaint is too long (max 300 characters)')
    .trim(),
  symptomsText: z
    .string()
    .min(5, 'Symptoms description must be at least 5 characters')
    .max(3000, 'Symptoms description is too long (max 3000 characters)')
    .trim(),
  duration: z.string().min(1, 'Duration is required (e.g. 3 days, 2 weeks)').trim(),
  severity: z.number().int().min(1).max(10, 'Severity must be on a scale of 1 to 10'),
  additionalNotes: z.string().max(1000).optional(),
});

export type SubmitSymptomsInput = z.infer<typeof submitSymptomsSchema>;
