import { prisma } from '../config/database.js';
import { SubmitSymptomsInput } from '../validators/symptom.validator.js';

export class SymptomRepository {
  async findByAppointmentId(appointmentId: string) {
    return prisma.symptomSubmission.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentNumber: true,
            status: true,
            doctorId: true,
            patientId: true,
            slotStartTime: true,
          },
        },
      },
    });
  }

  async upsertSymptoms(appointmentId: string, data: SubmitSymptomsInput) {
    return prisma.symptomSubmission.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        chiefComplaint: data.chiefComplaint,
        symptomsText: data.symptomsText,
        duration: data.duration,
        severity: data.severity,
        additionalNotes: data.additionalNotes,
      },
      update: {
        chiefComplaint: data.chiefComplaint,
        symptomsText: data.symptomsText,
        duration: data.duration,
        severity: data.severity,
        additionalNotes: data.additionalNotes,
        submittedAt: new Date(),
      },
      include: {
        appointment: {
          include: {
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
}

export const symptomRepository = new SymptomRepository();
