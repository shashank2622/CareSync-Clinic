import { UrgencyLevel } from '@prisma/client';

export interface PreVisitInput {
  chiefComplaint: string;
  symptoms: string;
  duration: string;
  severity: number;
  additionalNotes?: string;
  patientAge?: number;
  patientGender?: string;
  medicalHistory?: string;
}

export interface PreVisitOutput {
  urgencyLevel: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
  rawResponse?: string;
}

export interface PostVisitInput {
  clinicalNotes: string;
  diagnosis?: string;
  prescriptions: Array<{
    name: string;
    dosage: string;
    frequency: string;
    durationDays?: number;
    instructions?: string;
  }>;
  followUpInstructions?: string;
}

export interface PostVisitOutput {
  summary: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  followUpSteps: string[];
  rawResponse?: string;
}

export interface ILLMProvider {
  readonly name: string;
  generatePreVisitSummary(input: PreVisitInput): Promise<PreVisitOutput>;
  generatePostVisitSummary(input: PostVisitInput): Promise<PostVisitOutput>;
}
