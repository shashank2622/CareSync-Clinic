import bcrypt from 'bcryptjs';
import { doctorRepository, DoctorRepository } from '../repositories/doctor.repository.js';
import { userRepository, UserRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';
import {
  DoctorQueryInput,
  CreateDoctorInput,
  UpdateDoctorInput,
  SetWorkingHoursInput,
} from '../validators/doctor.validator.js';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from '../types/auth.types.js';

export class DoctorService {
  constructor(
    private doctorRepo: DoctorRepository = doctorRepository,
    private userRepo: UserRepository = userRepository
  ) {}

  async getDoctors(query: DoctorQueryInput) {
    return this.doctorRepo.findDoctors(query);
  }

  async getDoctorById(id: string) {
    const doctor = await this.doctorRepo.findDoctorById(id);
    if (!doctor) {
      throw AppError.notFound('Doctor not found');
    }
    return doctor;
  }

  async getSpecializations() {
    return this.doctorRepo.getSpecializations();
  }

  async createDoctor(input: CreateDoctorInput) {
    // Check if email already in use
    const existingEmail = await this.userRepo.findByEmail(input.email);
    if (existingEmail) {
      throw AppError.conflict('An account with this email address already exists');
    }

    // Check if license number already in use
    const existingLicense = await this.doctorRepo.findByLicense(input.licenseNumber);
    if (existingLicense) {
      throw AppError.conflict('A doctor profile with this medical license number already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    return this.doctorRepo.createDoctor({
      ...input,
      passwordHash,
    });
  }

  async updateDoctor(id: string, input: UpdateDoctorInput) {
    const doctor = await this.doctorRepo.findDoctorById(id);
    if (!doctor) {
      throw AppError.notFound('Doctor profile not found');
    }

    if (input.licenseNumber && input.licenseNumber !== doctor.licenseNumber) {
      const existingLicense = await this.doctorRepo.findByLicense(input.licenseNumber);
      if (existingLicense && existingLicense.id !== id) {
        throw AppError.conflict('Another doctor is already registered with this license number');
      }
    }

    const updated = await this.doctorRepo.updateDoctor(id, input);
    return updated;
  }

  async deleteDoctor(id: string) {
    const doctor = await this.doctorRepo.findDoctorById(id);
    if (!doctor) {
      throw AppError.notFound('Doctor profile not found');
    }

    await this.doctorRepo.deleteDoctor(id);
    return { success: true, message: 'Doctor profile deactivated successfully' };
  }

  async setWorkingHours(doctorId: string, input: SetWorkingHoursInput, user: AuthenticatedUser) {
    const doctor = await this.doctorRepo.findDoctorById(doctorId);
    if (!doctor) {
      throw AppError.notFound('Doctor profile not found');
    }

    // RBAC: Only Admin or the Doctor themselves can update working hours
    if (user.role === Role.DOCTOR && doctor.userId !== user.id) {
      throw AppError.forbidden('You can only manage your own working schedule');
    }

    const updatedHours = await this.doctorRepo.setWorkingHours(doctorId, input.workingHours);
    return updatedHours;
  }

  async getWorkingHours(doctorId: string) {
    const doctor = await this.doctorRepo.findDoctorById(doctorId);
    if (!doctor) {
      throw AppError.notFound('Doctor profile not found');
    }
    return this.doctorRepo.getWorkingHours(doctorId);
  }
}

export const doctorService = new DoctorService();
