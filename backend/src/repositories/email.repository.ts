import { prisma } from '../config/database.js';
import { DeliveryStatus } from '@prisma/client';

export class EmailRepository {
  async createDelivery(data: {
    notificationId?: string;
    recipientEmail: string;
    subject: string;
    templateName: string;
  }) {
    return prisma.emailDelivery.create({
      data: {
        notificationId: data.notificationId,
        recipientEmail: data.recipientEmail,
        subject: data.subject,
        templateName: data.templateName,
        deliveryStatus: DeliveryStatus.PENDING,
        retryCount: 0,
      },
    });
  }

  async updateDeliveryStatus(
    id: string,
    status: DeliveryStatus,
    retryCount: number,
    errorMessage?: string
  ) {
    return prisma.emailDelivery.update({
      where: { id },
      data: {
        deliveryStatus: status,
        retryCount,
        lastAttemptAt: new Date(),
        errorMessage: errorMessage || null,
      },
    });
  }

  async findDeliveriesByRecipient(recipientEmail: string) {
    return prisma.emailDelivery.findMany({
      where: { recipientEmail },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const emailRepository = new EmailRepository();
