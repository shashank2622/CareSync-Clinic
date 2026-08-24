import { postVisitRepository, PostVisitRepository } from '../repositories/postvisit.repository.js';
import { appointmentRepository, AppointmentRepository } from '../repositories/appointment.repository.js';
import { llmService, LLMService } from '../integrations/llm/llm.service.js';
import { AppError } from '../utils/app-error.js';
import { AuthenticatedUser } from '../types/auth.types.js';
import { Role, LLMProcessingStatus } from '@prisma/client';

export class PostVisitService {
  constructor(
    private postVisitRepo: PostVisitRepository = postVisitRepository,
    private appointmentRepo: AppointmentRepository = appointmentRepository,
    private llm: LLMService = llmService
  ) {}

  async getPostVisitSummary(appointmentId: string, user: AuthenticatedUser) {
    const appointment = await this.appointmentRepo.findAppointmentById(appointmentId);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    // RBAC: Patient, Doctor, or Admin
    if (user.role === Role.PATIENT && appointment.patientId !== user.patientProfile?.id) {
      throw AppError.forbidden('You do not have permission to view this summary');
    }
    if (user.role === Role.DOCTOR && appointment.doctorId !== user.doctorProfile?.id) {
      throw AppError.forbidden('You do not have permission to view this summary');
    }

    const prescription = await this.postVisitRepo.findPrescriptionWithDetails(appointmentId);

    // If notes exist but summary not generated yet, generate it automatically
    if (appointment.visitNote && (!prescription || !prescription.patientSummary)) {
      return this.generatePostVisitSummary(appointmentId, user);
    }

    if (!prescription || !prescription.patientSummary) {
      throw AppError.notFound('Post-visit summary has not been generated for this appointment yet');
    }

    return {
      appointmentId,
      appointmentNumber: appointment.appointmentNumber,
      doctorName: appointment.doctor.user.fullName,
      specialization: appointment.doctor.specialization,
      diagnosis: appointment.visitNote?.diagnosis || 'Clinical Consultation',
      summary: prescription.patientSummary,
      aiStatus: prescription.aiStatus,
      doctorNotes: prescription.doctorNotes,
      followUpInstructions: appointment.visitNote?.followUpInstructions,
      nextVisitRecommendedDate: appointment.visitNote?.nextVisitRecommendedDate,
      medications: prescription.medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: `${m.durationDays} days`,
        instructions: m.instructions,
      })),
      createdAt: prescription.updatedAt,
    };
  }

  async generatePostVisitSummary(appointmentId: string, user: AuthenticatedUser) {
    const appointment = await this.appointmentRepo.findAppointmentById(appointmentId);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    if (!appointment.visitNote) {
      throw AppError.badRequest('Cannot generate post-visit summary: Visit notes have not been recorded yet');
    }

    const prescription = await this.postVisitRepo.findPrescriptionWithDetails(appointmentId);

    const prescriptionsInput = prescription?.medications
      ? prescription.medications.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          durationDays: m.durationDays,
          instructions: m.instructions || undefined,
        }))
      : [];

    // Call Provider-Agnostic LLM Layer (Gemini with Fallback)
    const result = await this.llm.generatePostVisitSummary({
      clinicalNotes: appointment.visitNote.clinicalNotes,
      diagnosis: appointment.visitNote.diagnosis || undefined,
      prescriptions: prescriptionsInput,
      followUpInstructions: appointment.visitNote.followUpInstructions || undefined,
    });

    // If prescription record didn't exist yet, we ensure one is linked
    let targetPrescriptionId = prescription?.id;
    if (!targetPrescriptionId) {
      const createdPrescription = await this.postVisitRepo.updatePatientSummary(
        prescription?.id || (
          await (await import('../config/database.js')).prisma.prescription.create({
            data: {
              appointmentId,
              patientSummary: result.data.summary,
              aiStatus: result.status,
            },
          })
        ).id,
        {
          patientSummary: result.data.summary,
          aiStatus: result.status,
        }
      );
      targetPrescriptionId = createdPrescription.id;
    } else {
      await this.postVisitRepo.updatePatientSummary(targetPrescriptionId, {
        patientSummary: result.data.summary,
        aiStatus: result.status,
      });
    }

    return {
      appointmentId,
      appointmentNumber: appointment.appointmentNumber,
      doctorName: appointment.doctor.user.fullName,
      specialization: appointment.doctor.specialization,
      diagnosis: appointment.visitNote.diagnosis || 'Clinical Consultation',
      summary: result.data.summary,
      aiStatus: result.status,
      followUpInstructions: appointment.visitNote.followUpInstructions,
      followUpSteps: result.data.followUpSteps,
      nextVisitRecommendedDate: appointment.visitNote.nextVisitRecommendedDate,
      medications: result.data.medications,
    };
  }

  async retryPostVisitSummary(appointmentId: string, user: AuthenticatedUser) {
    if (user.role !== Role.DOCTOR && user.role !== Role.ADMIN) {
      throw AppError.forbidden('Only doctors and administrators can manually trigger AI summary regeneration');
    }

    return this.generatePostVisitSummary(appointmentId, user);
  }
}

export const postVisitService = new PostVisitService();
