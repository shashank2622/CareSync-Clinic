import { MockLLMProvider } from '../integrations/llm/mock.provider.js';
import { LLMService } from '../integrations/llm/llm.service.js';
import { LLMProcessingStatus, UrgencyLevel } from '@prisma/client';

describe('LLM Service & Graceful Fallback Tests', () => {
  const mockProvider = new MockLLMProvider();
  const llmService = new LLMService();
  llmService.setProvider(mockProvider);

  it('PRE-VISIT SUMMARY: Generates urgency assessment and suggested questions', async () => {
    const rawSymptoms = {
      chiefComplaint: 'Crushing chest pain radiating to left jaw',
      symptoms: 'Started 30 minutes ago, sweating heavily, shortness of breath',
      duration: '30 mins',
      severity: 9,
    };

    const result = await llmService.generatePreVisitSummary(rawSymptoms);

    expect(result).toBeDefined();
    expect(result.status).toBe(LLMProcessingStatus.SUCCESS);
    expect(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).toContain(result.data.urgencyLevel);
    expect(result.data.chiefComplaint).toBeDefined();
    expect(result.data.suggestedQuestions.length).toBeGreaterThan(0);
  });

  it('POST-VISIT SUMMARY: Formats clinical notes into patient-friendly instructions', async () => {
    const clinicalNotes = 'Patient diagnosed with Acute Viral Bronchitis. Prescribed Amoxicillin 500mg.';
    const prescriptions = [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'TWICE_DAILY', durationDays: 5 },
    ];

    const result = await llmService.generatePostVisitSummary({
      clinicalNotes,
      diagnosis: 'Acute Viral Bronchitis',
      prescriptions,
    });

    expect(result).toBeDefined();
    expect(result.status).toBe(LLMProcessingStatus.SUCCESS);
    expect(result.data.summary).toBeDefined();
    expect(result.data.medications.length).toBeGreaterThan(0);
    expect(result.data.followUpSteps.length).toBeGreaterThan(0);
  });

  it('FAULT TOLERANCE: Provider throwing error results in non-crashing fallback machine', async () => {
    // Failing provider simulation
    const failingProvider = {
      name: 'failing-test-provider',
      generatePreVisitSummary: async () => {
        throw new Error('503 Service Unavailable: Gemini Rate Limit Exceeded');
      },
      generatePostVisitSummary: async () => {
        throw new Error('503 Service Unavailable');
      },
    };

    const resilientService = new LLMService();
    resilientService.setProvider(failingProvider as any);

    const fallbackResult = await resilientService.generatePreVisitSummary({
      chiefComplaint: 'High fever and chills',
      symptoms: 'Fever 102F',
      duration: '1 day',
      severity: 8,
    });

    // Machine must not throw uncaught error; must return structured fallback status
    expect(fallbackResult.status).toBe(LLMProcessingStatus.FALLBACK);
    expect(fallbackResult.data.urgencyLevel).toBe(UrgencyLevel.HIGH);
    expect(fallbackResult.data.chiefComplaint).toContain('High fever and chills');
  });
});
