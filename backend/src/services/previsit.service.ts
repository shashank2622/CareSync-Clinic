import { preVisitRepository, PreVisitRepository } from '../repositories/previsit.repository.js';
import { appointmentRepository, AppointmentRepository } from '../repositories/appointment.repository.js';
import { llmService, LLMService } from '../integrations/llm/llm.service.js';
import { AppError } from '../utils/app-error.js';
import { AuthenticatedUser } from '../types/auth.types.js';
import { Role } from '@prisma/client';

export class PreVisitService {
  constructor(
    private preVisitRepo: PreVisitRepository = preVisitRepository,
    private appointmentRepo: AppointmentRepository = appointmentRepository,
    private llm: LLMService = llmService
  ) {}

  async getPreVisitSummary(appointmentId: string, user: AuthenticatedUser) {
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

    let summary = await this.preVisitRepo.findByAppointmentId(appointmentId);

    // If symptoms exist but summary has not been generated yet, generate it automatically
    if (!summary && appointment.symptomSubmission) {
      return this.generatePreVisitSummary(appointmentId, user);
    }

    if (!summary) {
      throw AppError.notFound('Pre-visit summary has not been generated for this appointment yet');
    }

    let parsedQuestions: string[] = [];
    try {
      parsedQuestions = typeof summary.suggestedQuestions === 'string'
        ? JSON.parse(summary.suggestedQuestions)
        : (summary.suggestedQuestions as any);
    } catch {
      parsedQuestions = [];
    }

    return {
      id: summary.id,
      appointmentId: summary.appointmentId,
      urgencyLevel: summary.urgencyLevel,
      chiefComplaintSummary: summary.chiefComplaintSummary,
      suggestedQuestions: parsedQuestions,
      status: summary.status,
      errorMessage: summary.errorMessage,
      generatedAt: summary.generatedAt,
      rawSymptoms: summary.appointment.symptomSubmission,
    };
  }

  async generatePreVisitSummary(appointmentId: string, user: AuthenticatedUser) {
    const appointment = await this.appointmentRepo.findAppointmentById(appointmentId);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    if (!appointment.symptomSubmission) {
      throw AppError.badRequest('No patient symptoms have been submitted for this appointment yet');
    }

    // Call LLM Service (Provider-agnostic with Gemini & Fallback)
    const result = await this.llm.generatePreVisitSummary({
      chiefComplaint: appointment.symptomSubmission.chiefComplaint,
      symptoms: appointment.symptomSubmission.symptomsText,
      duration: appointment.symptomSubmission.duration,
      severity: appointment.symptomSubmission.severity,
      additionalNotes: appointment.symptomSubmission.additionalNotes || undefined,
      medicalHistory: appointment.patient.medicalHistorySummary || undefined,
    });

    const savedSummary = await this.preVisitRepo.upsertPreVisitSummary(appointmentId, {
      urgencyLevel: result.data.urgencyLevel,
      chiefComplaintSummary: result.data.chiefComplaint,
      suggestedQuestions: result.data.suggestedQuestions,
      rawResponseText: result.data.rawResponse,
      status: result.status,
      errorMessage: result.errorMessage,
    });

    let parsedQuestions: string[] = [];
    try {
      parsedQuestions = typeof savedSummary.suggestedQuestions === 'string'
        ? JSON.parse(savedSummary.suggestedQuestions)
        : (savedSummary.suggestedQuestions as any);
    } catch {
      parsedQuestions = [];
    }

    return {
      id: savedSummary.id,
      appointmentId: savedSummary.appointmentId,
      urgencyLevel: savedSummary.urgencyLevel,
      chiefComplaintSummary: savedSummary.chiefComplaintSummary,
      suggestedQuestions: parsedQuestions,
      status: savedSummary.status,
      errorMessage: savedSummary.errorMessage,
      generatedAt: savedSummary.generatedAt,
      rawSymptoms: appointment.symptomSubmission,
    };
  }

  async retryPreVisitSummary(appointmentId: string, user: AuthenticatedUser) {
    // Only Doctor or Admin can manually trigger retry
    if (user.role !== Role.DOCTOR && user.role !== Role.ADMIN) {
      throw AppError.forbidden('Only doctors and administrators can manually trigger AI summary regeneration');
    }

    return this.generatePreVisitSummary(appointmentId, user);
  }
}

export const preVisitService = new PreVisitService();
