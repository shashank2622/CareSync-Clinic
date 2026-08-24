import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  fullName: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  phone?: string | null;
  isActive: boolean;
  patientProfile?: {
    id: string;
    dob?: Date | null;
    gender?: string | null;
    bloodGroup?: string | null;
    emergencyContact?: string | null;
    medicalHistorySummary?: string | null;
  } | null;
  doctorProfile?: {
    id: string;
    specialization: string;
    licenseNumber: string;
    experienceYears: number;
    bio?: string | null;
    consultationFee: any;
    slotDurationMinutes: number;
  } | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
