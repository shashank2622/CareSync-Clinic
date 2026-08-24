import { prisma } from '../config/database.js';
import { AppointmentStatus, LLMProcessingStatus } from '@prisma/client';
import { SubmitVisitNotesInput } from '../validators/clinical.validator.js';

export class ClinicalRepository {
  async saveVisitNotesAndPrescription(
    appointmentId: string,
    data: SubmitVisitNotesInput
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Upsert Visit Notes
      const nextVisitDate = data.nextVisitRecommendedDate
        ? new Date(data.nextVisitRecommendedDate)
        : null;

      const visitNote = await tx.visitNote.upsert({
        where: { appointmentId },
        create: {
          appointmentId,
          clinicalNotes: data.clinicalNotes,
          diagnosis: data.diagnosis,
          vitalSigns: data.vitalSigns ? (data.vitalSigns as any) : undefined,
          followUpInstructions: data.followUpInstructions,
          nextVisitRecommendedDate: nextVisitDate,
        },
        update: {
          clinicalNotes: data.clinicalNotes,
          diagnosis: data.diagnosis,
          vitalSigns: data.vitalSigns ? (data.vitalSigns as any) : undefined,
          followUpInstructions: data.followUpInstructions,
          nextVisitRecommendedDate: nextVisitDate,
        },
      });

      // 2. Upsert Prescription & Medications (if medications or doctorNotes provided)
      let prescription = null;
      if (data.medications && data.medications.length > 0 || data.doctorNotes) {
        prescription = await tx.prescription.upsert({
          where: { appointmentId },
          create: {
            appointmentId,
            doctorNotes: data.doctorNotes,
            aiStatus: LLMProcessingStatus.PENDING,
          },
          update: {
            doctorNotes: data.doctorNotes,
          },
        });

        // Replace medication items
        await tx.medication.deleteMany({
          where: { prescriptionId: prescription.id },
        });

        if (data.medications && data.medications.length > 0) {
          await tx.medication.createMany({
            data: data.medications.map((med) => ({
              prescriptionId: prescription!.id,
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              durationDays: med.durationDays,
              instructions: med.instructions,
              startDate: med.startDate ? new Date(med.startDate) : new Date(),
            })),
          });
        }
      }

      // 3. Conclude Appointment as COMPLETED
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.COMPLETED },
      });

      // 4. Return full updated appointment
      return tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } },
          symptomSubmission: true,
          preVisitSummary: true,
          visitNote: true,
          prescription: {
            include: {
              medications: true,
            },
          },
        },
      });
    });
  }

  async findVisitNoteByAppointmentId(appointmentId: string) {
    return prisma.visitNote.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            doctor: { include: { user: true } },
            patient: { include: { user: true } },
          },
        },
      },
    });
  }

  async findPrescriptionByAppointmentId(appointmentId: string) {
    return prisma.prescription.findUnique({
      where: { appointmentId },
      include: {
        medications: {
          include: {
            reminders: true,
          },
        },
        appointment: {
          include: {
            doctor: { include: { user: true } },
            patient: { include: { user: true } },
          },
        },
      },
    });
  }

  async findPatientPrescriptions(patientId: string) {
    return prisma.prescription.findMany({
      where: {
        appointment: {
          patientId,
        },
      },
      include: {
        medications: {
          include: {
            reminders: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentNumber: true,
            slotStartTime: true,
            doctor: {
              include: {
                user: {
                  select: { fullName: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const clinicalRepository = new ClinicalRepository();
