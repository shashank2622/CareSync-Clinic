import { ILLMProvider, PreVisitInput, PreVisitOutput, PostVisitInput, PostVisitOutput } from './llm.interface.js';
import { UrgencyLevel } from '@prisma/client';

export class MockLLMProvider implements ILLMProvider {
  public readonly name = 'mock';

  async generatePreVisitSummary(input: PreVisitInput): Promise<PreVisitOutput> {
    let urgencyLevel: UrgencyLevel = UrgencyLevel.LOW;
    if (input.severity >= 8 || input.symptoms.toLowerCase().includes('chest pain') || input.symptoms.toLowerCase().includes('breath')) {
      urgencyLevel = UrgencyLevel.HIGH;
    } else if (input.severity >= 5) {
      urgencyLevel = UrgencyLevel.MEDIUM;
    }

    return {
      urgencyLevel,
      chiefComplaint: `Patient reports ${input.chiefComplaint.toLowerCase()} of ${input.duration} duration (severity: ${input.severity}/10).`,
      suggestedQuestions: [
        `How does this ${input.chiefComplaint} affect your daily activities and sleep?`,
        'Have you noticed any triggers or factors that worsen or alleviate the discomfort?',
        'Are you currently taking any over-the-counter medications or home remedies?',
      ],
      rawResponse: JSON.stringify({
        mock: true,
        urgencyLevel,
        chiefComplaint: input.chiefComplaint,
      }),
    };
  }

  async generatePostVisitSummary(input: PostVisitInput): Promise<PostVisitOutput> {
    const meds = input.prescriptions.map((rx) => ({
      name: rx.name,
      dosage: rx.dosage,
      frequency: rx.frequency,
      duration: `${rx.durationDays || 7} days`,
    }));

    return {
      summary: `Your doctor reviewed your condition (${input.diagnosis || 'General Consultation'}) and provided the following guidance: ${input.clinicalNotes.slice(0, 180)}... Please adhere closely to the prescribed medication and rest.`,
      medications: meds,
      followUpSteps: [
        'Take all prescribed medications according to the schedule.',
        input.followUpInstructions || 'Contact the clinic or book a follow-up visit if symptoms do not improve.',
      ],
      rawResponse: JSON.stringify({ mock: true, diagnosis: input.diagnosis }),
    };
  }
}
