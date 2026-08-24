import { ILLMProvider, PreVisitInput, PreVisitOutput, PostVisitInput, PostVisitOutput } from './llm.interface.js';
import { GeminiProvider } from './gemini.provider.js';
import { MockLLMProvider } from './mock.provider.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { UrgencyLevel, LLMProcessingStatus } from '@prisma/client';

export interface PreVisitServiceResult {
  data: PreVisitOutput;
  status: LLMProcessingStatus;
  errorMessage?: string;
}

export interface PostVisitServiceResult {
  data: PostVisitOutput;
  status: LLMProcessingStatus;
  errorMessage?: string;
}

export class LLMService {
  private provider: ILLMProvider;

  constructor() {
    if (env.LLM_PROVIDER === 'gemini' && env.GEMINI_API_KEY) {
      this.provider = new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
      logger.info(`🤖 LLMService initialized with Google Gemini (${env.GEMINI_MODEL})`);
    } else {
      this.provider = new MockLLMProvider();
      logger.info('🤖 LLMService initialized with Mock / Offline LLM Provider');
    }
  }

  setProvider(provider: ILLMProvider) {
    this.provider = provider;
  }

  async generatePreVisitSummary(input: PreVisitInput): Promise<PreVisitServiceResult> {
    try {
      const output = await this.provider.generatePreVisitSummary(input);
      return {
        data: output,
        status: LLMProcessingStatus.SUCCESS,
      };
    } catch (error: any) {
      logger.warn(`⚠️  Pre-visit AI summary generation failed: ${error.message}. Activating rule-based fallback.`);

      // Graceful rule-based fallback — ensures system never crashes
      let fallbackUrgency: UrgencyLevel = UrgencyLevel.MEDIUM;
      if (input.severity >= 8) fallbackUrgency = UrgencyLevel.HIGH;
      if (input.severity <= 3) fallbackUrgency = UrgencyLevel.LOW;

      const fallbackOutput: PreVisitOutput = {
        urgencyLevel: fallbackUrgency,
        chiefComplaint: `Patient reports: ${input.chiefComplaint} (Duration: ${input.duration}, Severity: ${input.severity}/10).`,
        suggestedQuestions: [
          'When did you first notice these symptoms, and have they worsened over time?',
          'What medications or home remedies have you tried so far?',
          'Are you experiencing any other related symptoms or pain in other areas?',
        ],
        rawResponse: `Fallback generated due to provider error: ${error.message}`,
      };

      return {
        data: fallbackOutput,
        status: LLMProcessingStatus.FALLBACK,
        errorMessage: error.message,
      };
    }
  }

  async generatePostVisitSummary(input: PostVisitInput): Promise<PostVisitServiceResult> {
    try {
      const output = await this.provider.generatePostVisitSummary(input);
      return {
        data: output,
        status: LLMProcessingStatus.SUCCESS,
      };
    } catch (error: any) {
      logger.warn(`⚠️  Post-visit AI summary generation failed: ${error.message}. Activating rule-based fallback.`);

      const fallbackMeds = input.prescriptions.map((rx) => ({
        name: rx.name,
        dosage: rx.dosage,
        frequency: rx.frequency,
        duration: `${rx.durationDays || 7} days`,
      }));

      const fallbackOutput: PostVisitOutput = {
        summary: `Your consultation with the doctor concluded. Summary: ${input.clinicalNotes.slice(0, 200)}... Please follow the medication and care instructions below.`,
        medications: fallbackMeds,
        followUpSteps: [
          'Take prescribed medications according to the directions provided.',
          input.followUpInstructions || 'Contact the clinic if symptoms persist or if you have any questions.',
        ],
        rawResponse: `Fallback generated due to provider error: ${error.message}`,
      };

      return {
        data: fallbackOutput,
        status: LLMProcessingStatus.FALLBACK,
        errorMessage: error.message,
      };
    }
  }
}

export const llmService = new LLMService();
