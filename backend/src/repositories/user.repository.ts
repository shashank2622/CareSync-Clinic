import { prisma } from '../config/database.js';
import { Role, Gender, Prisma } from '@prisma/client';

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        patientProfile: true,
        doctorProfile: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        patientProfile: true,
        doctorProfile: true,
        googleOAuthToken: {
          select: {
            id: true,
            expiresAt: true,
            scope: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async createPatient(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    dob?: Date | null;
    gender?: Gender;
    bloodGroup?: string;
    emergencyContact?: string;
    medicalHistorySummary?: string;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: Role.PATIENT,
        patientProfile: {
          create: {
            dob: data.dob,
            gender: data.gender,
            bloodGroup: data.bloodGroup,
            emergencyContact: data.emergencyContact,
            medicalHistorySummary: data.medicalHistorySummary,
          },
        },
      },
      include: {
        patientProfile: true,
      },
    });
  }

  async updateUser(id: string, data: { fullName?: string; phone?: string; isActive?: boolean }) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePatientProfile(userId: string, data: {
    dob?: Date | null;
    gender?: Gender;
    bloodGroup?: string;
    emergencyContact?: string;
    medicalHistorySummary?: string;
  }) {
    return prisma.patientProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  async updateDoctorProfile(userId: string, data: {
    bio?: string;
    consultationFee?: Prisma.Decimal | number;
    slotDurationMinutes?: number;
  }) {
    return prisma.doctorProfile.update({
      where: { userId },
      data,
    });
  }

  // Token Management
  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            patientProfile: true,
            doctorProfile: true,
          },
        },
      },
    });
  }

  async revokeRefreshToken(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}

export const userRepository = new UserRepository();
