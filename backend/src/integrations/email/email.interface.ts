export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateName: string;
  notificationId?: string;
}

export interface IEmailProvider {
  readonly name: string;
  sendEmail(options: SendEmailOptions): Promise<{ messageId: string; previewUrl?: string }>;
}
