import { prisma } from '../config/database.js';
import { LLMProcessingStatus } from '@prisma/client';

export class PostVisitRepository {
  async findPrescriptionWithDetails(appointmentId: string) {
    return prisma.prescription.findUnique({
      where: { appointmentId },
      include: {
        medications: true,
        appointment: {
          include: {
            visitNote: true,
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

  async updatePatientSummary(
    prescriptionId: string,
    data: {
      patientSummary: string;
      aiStatus: LLMProcessingStatus;
    }
  ) {
    return prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        patientSummary: data.patientSummary,
        aiStatus: data.aiStatus,
      },
      include: {
        medications: true,
        appointment: {
          include: {
            visitNote: true,
            doctor: { include: { user: true } },
            patient: { include: { user: true } },
          },
        },
      },
    });
  }
}

export const postVisitRepository = new PostVisitRepository();
