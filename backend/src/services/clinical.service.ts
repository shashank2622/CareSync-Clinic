import { clinicalRepository, ClinicalRepository } from '../repositories/clinical.repository.js';
import { appointmentRepository, AppointmentRepository } from '../repositories/appointment.repository.js';
import { AppError } from '../utils/app-error.js';
import { SubmitVisitNotesInput } from '../validators/clinical.validator.js';
import { AuthenticatedUser } from '../types/auth.types.js';
import { Role, AppointmentStatus } from '@prisma/client';

export class ClinicalService {
  constructor(
    private clinicalRepo: ClinicalRepository = clinicalRepository,
    private appointmentRepo: AppointmentRepository = appointmentRepository
  ) {}

  async submitVisitNotes(appointmentId: string, input: SubmitVisitNotesInput, user: AuthenticatedUser) {
    const appointment = await this.appointmentRepo.findAppointmentById(appointmentId);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    // RBAC: Only the assigned Doctor (or Admin) can submit clinical notes
    if (user.role === Role.DOCTOR && appointment.doctorId !== user.doctorProfile?.id) {
      throw AppError.forbidden('You can only submit clinical notes for your own assigned consultations');
    }
    if (user.role === Role.PATIENT) {
      throw AppError.forbidden('Patients cannot submit clinical visit notes');
    }

    if (
      appointment.status === AppointmentStatus.CANCELLED_BY_PATIENT ||
      appointment.status === AppointmentStatus.CANCELLED_BY_DOCTOR ||
      appointment.status === AppointmentStatus.CANCELLED_BY_ADMIN ||
      appointment.status === AppointmentStatus.CANCELLED_DOCTOR_LEAVE
    ) {
      throw AppError.badRequest('Cannot record clinical notes for a cancelled appointment');
    }

    const completedAppointment = await this.clinicalRepo.saveVisitNotesAndPrescription(
      appointmentId,
      input
    );

    return completedAppointment;
  }

  async getVisitNotes(appointmentId: string, user: AuthenticatedUser) {
    const appointment = await this.appointmentRepo.findAppointmentById(appointmentId);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    if (user.role === Role.PATIENT && appointment.patientId !== user.patientProfile?.id) {
      throw AppError.forbidden('You do not have permission to view clinical notes for this appointment');
    }
    if (user.role === Role.DOCTOR && appointment.doctorId !== user.doctorProfile?.id) {
      throw AppError.forbidden('You do not have permission to view clinical notes for this appointment');
    }

    const notes = await this.clinicalRepo.findVisitNoteByAppointmentId(appointmentId);
    if (!notes) {
      throw AppError.notFound('Clinical visit notes have not been recorded for this appointment yet');
    }

    return notes;
  }

  async getPrescription(appointmentId: string, user: AuthenticatedUser) {
    const appointment = await this.appointmentRepo.findAppointmentById(appointmentId);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    if (user.role === Role.PATIENT && appointment.patientId !== user.patientProfile?.id) {
      throw AppError.forbidden('You do not have permission to view this prescription');
    }
    if (user.role === Role.DOCTOR && appointment.doctorId !== user.doctorProfile?.id) {
      throw AppError.forbidden('You do not have permission to view this prescription');
    }

    const prescription = await this.clinicalRepo.findPrescriptionByAppointmentId(appointmentId);
    if (!prescription) {
      throw AppError.notFound('No prescription was issued for this appointment');
    }

    return prescription;
  }

  async getMyPrescriptions(user: AuthenticatedUser) {
    if (user.role !== Role.PATIENT || !user.patientProfile) {
      throw AppError.forbidden('Only patients can access their personal prescription history');
    }

    return this.clinicalRepo.findPatientPrescriptions(user.patientProfile.id);
  }
}

export const clinicalService = new ClinicalService();
