import { prisma } from '../config/database.js';
import { Role, Prisma } from '@prisma/client';
import { DoctorQueryInput, CreateDoctorInput, UpdateDoctorInput, SetWorkingHoursInput } from '../validators/doctor.validator.js';

export class DoctorRepository {
  async findDoctors(query: DoctorQueryInput) {
    const { specialization, search, minExperience, maxFee, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DoctorProfileWhereInput = {
      user: {
        isActive: true,
      },
      ...(specialization ? { specialization: { equals: specialization, mode: 'insensitive' } } : {}),
      ...(minExperience !== undefined ? { experienceYears: { gte: minExperience } } : {}),
      ...(maxFee !== undefined ? { consultationFee: { lte: maxFee } } : {}),
      ...(search
        ? {
            OR: [
              { user: { fullName: { contains: search, mode: 'insensitive' } } },
              { specialization: { contains: search, mode: 'insensitive' } },
              { bio: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, doctors] = await Promise.all([
      prisma.doctorProfile.count({ where }),
      prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              isActive: true,
            },
          },
          workingHours: {
            orderBy: { dayOfWeek: 'asc' },
          },
        },
        orderBy: { experienceYears: 'desc' },
      }),
    ]);

    return {
      doctors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findDoctorById(id: string) {
    return prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
          },
        },
        workingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        leaves: {
          where: {
            endDate: { gte: new Date() },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        workingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });
  }

  async findByLicense(licenseNumber: string) {
    return prisma.doctorProfile.findUnique({
      where: { licenseNumber },
    });
  }

  async createDoctor(data: CreateDoctorInput & { passwordHash: string }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          phone: data.phone,
          role: Role.DOCTOR,
          doctorProfile: {
            create: {
              specialization: data.specialization,
              licenseNumber: data.licenseNumber,
              experienceYears: data.experienceYears,
              bio: data.bio,
              consultationFee: data.consultationFee,
              slotDurationMinutes: data.slotDurationMinutes,
            },
          },
        },
        include: {
          doctorProfile: true,
        },
      });

      const doctorProfileId = user.doctorProfile!.id;

      // Default working hours: Monday (1) through Friday (5), 09:00 - 17:00, lunch 13:00 - 14:00
      const defaultHours = [1, 2, 3, 4, 5].map((day) => ({
        doctorId: doctorProfileId,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        isAvailable: true,
      }));

      await tx.doctorWorkingHour.createMany({
        data: defaultHours,
      });

      return this.findDoctorById(doctorProfileId);
    });
  }

  async updateDoctor(id: string, data: UpdateDoctorInput) {
    const existing = await prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) return null;

    return prisma.$transaction(async (tx) => {
      if (data.fullName || data.phone || data.isActive !== undefined) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            fullName: data.fullName,
            phone: data.phone,
            isActive: data.isActive,
          },
        });
      }

      const updatedProfile = await tx.doctorProfile.update({
        where: { id },
        data: {
          specialization: data.specialization,
          licenseNumber: data.licenseNumber,
          experienceYears: data.experienceYears,
          bio: data.bio,
          consultationFee: data.consultationFee,
          slotDurationMinutes: data.slotDurationMinutes,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              isActive: true,
            },
          },
          workingHours: true,
        },
      });

      return updatedProfile;
    });
  }

  async deleteDoctor(id: string) {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id },
    });
    if (!doctor) return null;

    // Soft delete user
    return prisma.user.update({
      where: { id: doctor.userId },
      data: { isActive: false },
    });
  }

  async setWorkingHours(doctorId: string, hours: SetWorkingHoursInput['workingHours']) {
    return prisma.$transaction(async (tx) => {
      // Remove previous hours for this doctor
      await tx.doctorWorkingHour.deleteMany({
        where: { doctorId },
      });

      // Insert new hours
      await tx.doctorWorkingHour.createMany({
        data: hours.map((h) => ({
          doctorId,
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
          isAvailable: h.isAvailable,
          breakStartTime: h.breakStartTime || null,
          breakEndTime: h.breakEndTime || null,
        })),
      });

      return tx.doctorWorkingHour.findMany({
        where: { doctorId },
        orderBy: { dayOfWeek: 'asc' },
      });
    });
  }

  async getWorkingHours(doctorId: string) {
    return prisma.doctorWorkingHour.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async getSpecializations(): Promise<string[]> {
    const results = await prisma.doctorProfile.findMany({
      where: { user: { isActive: true } },
      select: { specialization: true },
      distinct: ['specialization'],
    });
    return results.map((r) => r.specialization).sort();
  }
}

export const doctorRepository = new DoctorRepository();
