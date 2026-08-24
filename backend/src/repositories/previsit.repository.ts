import { prisma } from '../config/database.js';
import { UrgencyLevel, LLMProcessingStatus } from '@prisma/client';

export class PreVisitRepository {
  async findByAppointmentId(appointmentId: string) {
    return prisma.preVisitSummary.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            symptomSubmission: true,
            doctor: {
              include: { user: true },
            },
            patient: {
              include: { user: true },
            },
          },
        },
      },
    });
  }

  async upsertPreVisitSummary(
    appointmentId: string,
    data: {
      urgencyLevel: UrgencyLevel;
      chiefComplaintSummary: string;
      suggestedQuestions: string[];
      rawResponseText?: string;
      status: LLMProcessingStatus;
      errorMessage?: string;
    }
  ) {
    return prisma.preVisitSummary.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        urgencyLevel: data.urgencyLevel,
        chiefComplaintSummary: data.chiefComplaintSummary,
        suggestedQuestions: JSON.stringify(data.suggestedQuestions),
        rawResponseText: data.rawResponseText,
        status: data.status,
        errorMessage: data.errorMessage,
      },
      update: {
        urgencyLevel: data.urgencyLevel,
        chiefComplaintSummary: data.chiefComplaintSummary,
        suggestedQuestions: JSON.stringify(data.suggestedQuestions),
        rawResponseText: data.rawResponseText,
        status: data.status,
        errorMessage: data.errorMessage,
        generatedAt: new Date(),
      },
    });
  }
}

export const preVisitRepository = new PreVisitRepository();
