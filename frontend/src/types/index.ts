export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type AppointmentStatus =
  | 'HOLD_ACTIVE'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED_BY_PATIENT'
  | 'CANCELLED_BY_DOCTOR'
  | 'CANCELLED_BY_ADMIN'
  | 'CANCELLED_DOCTOR_LEAVE'
  | 'RESCHEDULED'
  | 'NO_SHOW';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type LLMProcessingStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'FALLBACK';
export type ReminderFrequency =
  | 'ONCE_DAILY'
  | 'TWICE_DAILY'
  | 'THREE_TIMES_DAILY'
  | 'EVERY_8_HOURS'
  | 'EVERY_12_HOURS'
  | 'CUSTOM';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string | null;
  isActive: boolean;
  patientProfile?: PatientProfile | null;
  doctorProfile?: DoctorProfile | null;
  hasGoogleCalendarConnected?: boolean;
}

export interface PatientProfile {
  id: string;
  userId: string;
  dob?: string | null;
  gender?: Gender | null;
  bloodGroup?: string | null;
  emergencyContact?: string | null;
  medicalHistorySummary?: string | null;
}

export interface DoctorWorkingHour {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
}

export interface DoctorLeave {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  approvedBy?: { fullName: string; email: string } | null;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  experienceYears: number;
  bio?: string | null;
  consultationFee: number | string;
  slotDurationMinutes: number;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    isActive: boolean;
  };
  workingHours?: DoctorWorkingHour[];
  leaves?: DoctorLeave[];
}

export interface GeneratedSlot {
  startTime: string;
  endTime: string;
  slotStartTime: string;
  slotEndTime: string;
  isAvailable: boolean;
  status: 'AVAILABLE' | 'BOOKED' | 'HELD' | 'BREAK' | 'IN_PAST';
  isHeldByYou?: boolean;
  holdToken?: string;
  holdExpiresAt?: string;
  remainingHoldSeconds?: number;
}

export interface DoctorAvailability {
  doctorId: string;
  doctorName: string;
  specialization?: string;
  consultationFee?: number | string;
  date: string;
  isAvailable: boolean;
  reason?: string;
  message?: string;
  slotDurationMinutes: number;
  totalSlots: number;
  availableSlotsCount: number;
  slots: GeneratedSlot[];
}

export interface SymptomSubmission {
  id: string;
  appointmentId: string;
  chiefComplaint: string;
  symptomsText: string;
  duration: string;
  severity: number;
  additionalNotes?: string | null;
  submittedAt: string;
}

export interface PreVisitSummary {
  id: string;
  appointmentId: string;
  urgencyLevel: UrgencyLevel;
  chiefComplaintSummary: string;
  suggestedQuestions: string[];
  status: LLMProcessingStatus;
  errorMessage?: string | null;
  generatedAt: string;
  rawSymptoms?: SymptomSubmission;
}

export interface Medication {
  id: string;
  prescriptionId: string;
  name: string;
  dosage: string;
  frequency: ReminderFrequency;
  durationDays: number;
  instructions?: string | null;
  startDate: string;
  reminders?: MedicationReminder[];
}

export interface Prescription {
  id: string;
  appointmentId: string;
  doctorNotes?: string | null;
  patientSummary?: string | null;
  aiStatus: LLMProcessingStatus;
  createdAt: string;
  updatedAt: string;
  medications: Medication[];
  appointment?: {
    id: string;
    appointmentNumber: string;
    slotStartTime: string;
    doctor: {
      user: { fullName: string; email: string };
    };
  };
}

export interface VisitNote {
  id: string;
  appointmentId: string;
  clinicalNotes: string;
  diagnosis?: string | null;
  vitalSigns?: {
    bp?: string;
    hr?: number | string;
    temp?: string;
    spo2?: string;
    weightKg?: number | string;
  } | null;
  followUpInstructions?: string | null;
  nextVisitRecommendedDate?: string | null;
}

export interface CalendarEvent {
  id: string;
  appointmentId: string;
  googleEventIdDoctor?: string | null;
  googleEventIdPatient?: string | null;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED' | 'CANCELLED';
  lastSyncedAt?: string | null;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  doctorId: string;
  patientId: string;
  slotStartTime: string;
  slotEndTime: string;
  status: AppointmentStatus;
  cancellationReason?: string | null;
  createdAt: string;
  doctor: {
    specialization: string;
    consultationFee: number | string;
    user: { id: string; fullName: string; email: string; phone?: string | null };
  };
  patient: {
    bloodGroup?: string | null;
    medicalHistorySummary?: string | null;
    user: { id: string; fullName: string; email: string; phone?: string | null };
  };
  symptomSubmission?: SymptomSubmission | null;
  preVisitSummary?: PreVisitSummary | null;
  visitNote?: VisitNote | null;
  prescription?: Prescription | null;
  calendarEvent?: CalendarEvent | null;
}

export interface MedicationReminder {
  id: string;
  medicationId: string;
  patientId: string;
  scheduledTime: string;
  frequency: ReminderFrequency;
  isActive: boolean;
  lastSentAt?: string | null;
  nextRunAt?: string | null;
  medication: Medication & {
    prescription?: {
      appointment?: {
        doctor: {
          user: { fullName: string };
        };
      };
    };
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  code?: string;
  meta?: any;
}
