import { IEmailProvider, SendEmailOptions } from './email.interface.js';
import { logger } from '../../utils/logger.js';

export class MockEmailProvider implements IEmailProvider {
  public readonly name = 'mock';

  async sendEmail(options: SendEmailOptions): Promise<{ messageId: string; previewUrl?: string }> {
    const mockId = `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    logger.info(`📧 [MockEmailProvider] Simulated email sent to [${options.to}] (Subject: "${options.subject}") | ID: ${mockId}`);
    return {
      messageId: mockId,
      previewUrl: `http://localhost:5000/api/mock-emails/${mockId}`,
    };
  }
}
