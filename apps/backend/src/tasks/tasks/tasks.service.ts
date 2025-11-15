import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('registration') private registrationQueue: Queue,
  ) {}

  // Runs every minute for easy development testing
  // For production (every night), use: CronExpression.CRON_0_0_*
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCompetitionReminders() {
    this.logger.log('CRON: Checking for competition reminders to send...');

    // 1. Find competitions starting in the next 24 hours
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingCompetitions = await this.prisma.competition.findMany({
      where: {
        // NOTE: This logic is simple; real-world would use a proper start date.
        // For this assignment, we'll assume regDeadline is the event start.
        regDeadline: {
          gte: now,
          lte: in24Hours,
        },
      },
      include: {
        registrations: { // Get all registered users
          include: {
            user: true,
          },
        },
      },
    });

    if (upcomingCompetitions.length === 0) {
      this.logger.log('CRON: No upcoming competitions found.');
      return;
    }

    // 2. Loop through competitions and enqueue jobs for each registered user
    for (const competition of upcomingCompetitions) {
      this.logger.log(`CRON: Processing reminders for ${competition.title}`);
      
      for (const reg of competition.registrations) {
        // 3. Add a *new job type* to our *existing* queue
        await this.registrationQueue.add(
          'reminder:notify', // Job name
          { // Payload
            userId: reg.userId,
            email: reg.user.email,
            userName: reg.user.name,
            competitionTitle: competition.title,
          },
          {
            // Don't retry reminders, just send once
            attempts: 1, 
          },
        );
        this.logger.log(`CRON: Enqueued reminder for ${reg.user.email}`);
      }
    }
  }
}