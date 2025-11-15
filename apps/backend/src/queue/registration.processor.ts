import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

// Payload for the confirmation job
type ConfirmationPayload = {
  registrationId: number;
  userId: number;
  competitionId: number;
};

// Payload for the reminder job
type ReminderPayload = {
  userId: number;
  email: string;
  userName: string;
  competitionTitle: string;
};

@Processor('registration') 
export class RegistrationProcessor {
  private readonly logger = new Logger(RegistrationProcessor.name);

  constructor(private prisma: PrismaService) {}

  // Binds to the 'registration:confirmation' job name
  @Process('registration:confirmation') 
  async handleConfirmation(job: Job<ConfirmationPayload>) {
    this.logger.log(`Processing confirmation for reg: ${job.data.registrationId}`);
    const { registrationId, userId } = job.data;

    try {
      // 1. Verify registration is still valid
      const registration = await this.prisma.registration.findUnique({
        where: { id: registrationId },
        include: { user: true, competition: true },
      });

      if (!registration) {
        throw new Error(`Registration ${registrationId} not found.`);
      }

      // 2. Simulate sending confirmation by writing to MailBox table
      await this.prisma.mailBox.create({
        data: {
          userId: userId,
          to: registration.user.email,
          subject: `Confirmation: ${registration.competition.title}`,
          body: `Hi ${registration.user.name}, you are confirmed for ${registration.competition.title}!`,
        },
      });

      this.logger.log(`MailBox record created for user: ${userId}`);

    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}: ${error.message}`);
      throw error; 
    }
  }

  @Process('reminder:notify')
  async handleReminder(job: Job<ReminderPayload>) {
    const { email, userName, competitionTitle, userId } = job.data;
    this.logger.log(`Processing reminder for: ${email}`);
    
    try {
      await this.prisma.mailBox.create({
        data: {
          userId: userId,
          to: email,
          subject: `Reminder: ${competitionTitle} is starting soon!`,
          body: `Hi ${userName}, this is a reminder that ${competitionTitle} starts in the next 24 hours.`,
        },
      });
      this.logger.log(`MailBox reminder created for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to process reminder job ${job.id}: ${error.message}`);
      throw error;
    }
  }

  // Handles failed jobs 
  @OnQueueFailed()
  handleFailedJob(job: Job<ConfirmationPayload>, error: Error) {
    this.logger.error(`Job ${job.id} failed after retries: ${error.message}`);
  }
}