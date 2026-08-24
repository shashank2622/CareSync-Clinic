import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILLMProvider, PreVisitInput, PreVisitOutput, PostVisitInput, PostVisitOutput } from './llm.interface.js';
import { UrgencyLevel } from '@prisma/client';
import { logger } from '../../utils/logger.js';

export class GeminiProvider implements ILLMProvider {
  public readonly name = 'gemini';
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'gemini-1.5-flash') {
    this.modelName = modelName;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  private mapUrgencyLevel(levelStr?: string): UrgencyLevel {
    const normalized = (levelStr || '').toUpperCase().trim();
    if (normalized.includes('EMERGENCY')) return UrgencyLevel.EMERGENCY;
    if (normalized.includes('HIGH')) return UrgencyLevel.HIGH;
    if (normalized.includes('MEDIUM') || normalized.includes('MODERATE')) return UrgencyLevel.MEDIUM;
    return UrgencyLevel.LOW;
  }

  private cleanJsonString(rawText: string): string {
    return rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  async generatePreVisitSummary(input: PreVisitInput): Promise<PreVisitOutput> {
    if (!this.genAI) {
      throw new Error('Gemini API key is not configured');
    }

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const symptomsDescription = `
Chief Complaint: ${input.chiefComplaint}
Detailed Symptoms: ${input.symptoms}
Duration: ${input.duration}
Severity Rating (1-10): ${input.severity}/10
${input.additionalNotes ? `Additional Notes: ${input.additionalNotes}` : ''}
${input.medicalHistory ? `Medical History: ${input.medicalHistory}` : ''}
    `.trim();

    const prompt = `
You are an expert clinical intake assistant preparing a concise, high-utility pre-visit summary for a doctor.
Analyse these symptoms and return: urgency level (Low / Medium / High / Emergency), chief complaint, and three suggested questions for the doctor.
Symptoms: ${symptomsDescription}

Output ONLY a JSON object matching this exact structure:
{
  "urgencyLevel": "Low" | "Medium" | "High" | "Emergency",
  "chiefComplaint": "Concise 1-2 sentence clinical summary of the patient's primary complaint",
  "suggestedQuestions": [
    "Targeted diagnostic question 1",
    "Targeted diagnostic question 2",
    "Targeted diagnostic question 3"
  ]
}

Important Medical Disclaimer: This is an administrative clinical preparation summary, NOT a confirmed diagnosis or medical advice.
    `.trim();

    // Enforce 8-second timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API request timed out after 8000ms')), 8000)
    );

    const apiCallPromise = async (): Promise<PreVisitOutput> => {
      const result = await model.generateContent(prompt);
      const rawResponseText = result.response.text();
      const cleaned = this.cleanJsonString(rawResponseText);
      const parsed = JSON.parse(cleaned);

      return {
        urgencyLevel: this.mapUrgencyLevel(parsed.urgencyLevel),
        chiefComplaint: parsed.chiefComplaint || input.chiefComplaint,
        suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
          ? parsed.suggestedQuestions.slice(0, 3)
          : [
              'How long have you noticed these symptoms?',
              'Have you taken any medication for relief?',
              'Are you experiencing any other related discomfort?',
            ],
        rawResponse: rawResponseText,
      };
    };

    return Promise.race([apiCallPromise(), timeoutPromise]);
  }

  async generatePostVisitSummary(input: PostVisitInput): Promise<PostVisitOutput> {
    if (!this.genAI) {
      throw new Error('Gemini API key is not configured');
    }

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const prescriptionDetails = input.prescriptions
      .map(
        (rx, idx) =>
          `${idx + 1}. ${rx.name} - Dosage: ${rx.dosage}, Frequency: ${rx.frequency}, Duration: ${rx.durationDays || 7} days${rx.instructions ? `, Instructions: ${rx.instructions}` : ''}`
      )
      .join('\n');

    const clinicalContext = `
Diagnosis: ${input.diagnosis || 'Clinical evaluation'}
Clinical Notes: ${input.clinicalNotes}
Prescriptions:\n${prescriptionDetails || 'None prescribed'}
Follow-up Instructions: ${input.followUpInstructions || 'Follow routine health practices'}
    `.trim();

    const prompt = `
Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps.
Ensure the summary is clear, empathetic, easy for a patient to understand, and contains zero medical jargon without explanation.
Doctor's input is the authoritative source of truth — never invent symptoms, diagnoses, or medications not provided.

Clinical Notes: ${clinicalContext}

Output ONLY a JSON object matching this exact structure:
{
  "summary": "Clear, encouraging, easy-to-read explanation of what was discussed, the doctor's findings, and general care guidance",
  "medications": [
    {
      "name": "Medication Name",
      "dosage": "500mg",
      "frequency": "Twice daily with meals",
      "duration": "7 days"
    }
  ],
  "followUpSteps": [
    "Step 1: Specific action item",
    "Step 2: When to schedule return visit or what symptoms require immediate medical attention"
  ]
}
    `.trim();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API request timed out after 8000ms')), 8000)
    );

    const apiCallPromise = async (): Promise<PostVisitOutput> => {
      const result = await model.generateContent(prompt);
      const rawResponseText = result.response.text();
      const cleaned = this.cleanJsonString(rawResponseText);
      const parsed = JSON.parse(cleaned);

      return {
        summary: parsed.summary || 'Consultation concluded. Please review your doctor\'s instructions.',
        medications: Array.isArray(parsed.medications) ? parsed.medications : [],
        followUpSteps: Array.isArray(parsed.followUpSteps) ? parsed.followUpSteps : ['Return for follow-up if symptoms persist.'],
        rawResponse: rawResponseText,
      };
    };

    return Promise.race([apiCallPromise(), timeoutPromise]);
  }
}
