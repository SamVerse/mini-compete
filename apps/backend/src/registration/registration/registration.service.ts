import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
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
    // Using Prisma's interactive transaction to keep all steps atomic
    try {
      const result = await this.prisma.$transaction(async (tx) => {

        // 1) ROW LOCK: lock the competition row to avoid capacity races
        //    SELECT ... FOR UPDATE ensures only one transaction at a time
        //    can modify registrations for this competition.

        const competitionRows: any = await tx.$queryRaw`
          SELECT * FROM "competitions" WHERE "id" = ${competitionId} FOR UPDATE
        `;
        const competition = Array.isArray(competitionRows)
          ? competitionRows[0]
          : competitionRows;

        if (!competition) {
          throw new BadRequestException('Competition not found.');
        }
        if (new Date() > new Date(competition.regDeadline)) {
          throw new BadRequestException('Registration deadline has passed.');
        }

        // 2) IDEMPOTENT USER: ensure this user is not already registered
        const existing = await tx.registration.findUnique({
          where: { userId_competitionId: { userId, competitionId } },
        });

        if (existing) {
          throw new ConflictException('Already registered.');
        }

        // 3) CAPACITY CHECK: count AFTER we hold the row lock
        const registrationCount = await tx.registration.count({
          where: { competitionId },
        });

        if (registrationCount >= competition.capacity) {
          throw new ConflictException('Competition is full.');
        }

        // 4) CREATE: safe to insert, lock + checks already done
        const registration = await tx.registration.create({
          data: {
            userId,
            competitionId,
          },
        });

        return registration;
      });

      // 5) ASYNC SIDE-EFFECT: enqueue confirmation email job
      await this.registrationQueue.add(
        'registration:confirmation',
        {
          registrationId: result.id,
          userId: result.userId,
          competitionId: result.competitionId,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );

      this.logger.log(`Added confirmation job for reg: ${result.id}`);

      return { registrationId: result.id, message: 'Registration successful.' };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // Prisma unique constraint (double registration race)
      if (error.code === 'P2002') {
        throw new ConflictException('Already registered.');
      }
      this.logger.error(`Registration failed: ${error.message}`);
      throw new BadRequestException('Registration failed.');
    }
  }
}
