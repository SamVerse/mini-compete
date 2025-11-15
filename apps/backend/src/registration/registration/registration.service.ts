import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('registration') private registrationQueue: Queue, // Inject the queue
  ) {}

  async register(competitionId: number, userId: number) {
    // Use Prisma's interactive transaction to ensure atomic operations
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Get competition and check deadline/capacity [cite: 37]
        const competition = await tx.competition.findUnique({
          where: { id: competitionId },
        });

        if (!competition) {
          throw new BadRequestException('Competition not found.');
        }
        if (new Date() > competition.regDeadline) {
          throw new BadRequestException('Registration deadline has passed.');
        }

        // 2. Check if already registered [cite: 38]
        const existing = await tx.registration.findUnique({
          where: { userId_competitionId: { userId, competitionId } },
        });
        if (existing) {
          throw new ConflictException('Already registered.');
        }

        // 3. CONCURRENCY CHECK: Get current count and compare to capacity 
        const registrationCount = await tx.registration.count({
          where: { competitionId },
        });

        if (registrationCount >= competition.capacity) {
          throw new ConflictException('Competition is full.');
        }

        // 4. All checks passed. Create the registration.
        const registration = await tx.registration.create({
          data: {
            userId,
            competitionId,
          },
        });

        return registration;
      });

      // 5. After transaction SUCCEEDS, add job to queue [cite: 40]
      await this.registrationQueue.add(
        'registration:confirmation', // Job name
        { // Payload [cite: 47]
          registrationId: result.id,
          userId: result.userId,
          competitionId: result.competitionId,
        },
        { // Retry settings [cite: 51]
          attempts: 3, 
          backoff: { type: 'exponential', delay: 5000 },
        },
      );

      this.logger.log(`Added confirmation job for reg: ${result.id}`);
      return { registrationId: result.id, message: 'Registration successful.' };

    } catch (error) {
      // Handle specific errors thrown from inside the transaction
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      // Handle Prisma-specific errors (e.g., P2002 for unique constraint)
      if (error.code === 'P2002') {
         throw new ConflictException('Already registered.');
      }
      // Generic error
      this.logger.error(`Registration failed: ${error.message}`);
      throw new BadRequestException('Registration failed.');
    }
  }
}