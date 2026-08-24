import { symptomRepository, SymptomRepository } from '../repositories/symptom.repository.js';
import { appointmentRepository, AppointmentRepository } from '../repositories/appointment.repository.js';
import { AppError } from '../utils/app-error.js';
import { SubmitSymptomsInput } from '../validators/symptom.validator.js';
import { AuthenticatedUser } from '../types/auth.types.js';
import { AppointmentStatus, Role } from '@prisma/client';

export class SymptomService {
  constructor(
    private symptomRepo: SymptomRepository = symptomRepository,
    private appointmentRepo: AppointmentRepository = appointmentRepository
  ) {}

  async submitSymptoms(appointmentId: string, input: SubmitSymptomsInput, user: AuthenticatedUser) {
    const appointment = await this.appointmentRepo.findAppointmentById(appointmentId);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    // Permission check: only the patient who owns the booking (or Admin) can submit symptoms
    if (user.role === Role.PATIENT && appointment.patientId !== user.patientProfile?.id) {
      throw AppError.forbidden('You can only submit symptoms for your own appointments');
    }

    if (
      appointment.status === AppointmentStatus.CANCELLED_BY_PATIENT ||
      appointment.status === AppointmentStatus.CANCELLED_BY_DOCTOR ||
      appointment.status === AppointmentStatus.CANCELLED_BY_ADMIN ||
      appointment.status === AppointmentStatus.CANCELLED_DOCTOR_LEAVE
    ) {
      throw AppError.badRequest('Cannot submit symptoms for a cancelled appointment');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw AppError.badRequest('Cannot update symptoms for an appointment that has already concluded');
    }

    const submission = await this.symptomRepo.upsertSymptoms(appointmentId, input);
    return submission;
  }

  async getSymptoms(appointmentId: string, user: AuthenticatedUser) {
    const appointment = await this.appointmentRepo.findAppointmentById(appointmentId);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    // RBAC: Patient, assigned Doctor, or Admin can view symptoms
    if (user.role === Role.PATIENT && appointment.patientId !== user.patientProfile?.id) {
      throw AppError.forbidden('You do not have permission to view symptoms for this appointment');
    }
    if (user.role === Role.DOCTOR && appointment.doctorId !== user.doctorProfile?.id) {
      throw AppError.forbidden('You do not have permission to view symptoms for this patient');
    }

    const symptoms = await this.symptomRepo.findByAppointmentId(appointmentId);
    if (!symptoms) {
      throw AppError.notFound('No symptoms have been submitted for this appointment yet');
    }

    return symptoms;
  }
}

export const symptomService = new SymptomService();
