import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module'; // Processor needs the DB
import { RegistrationProcessor } from './registration.processor';

@Module({
  imports: [
    PrismaModule, 
    BullModule.registerQueue({
      name: 'registration', // Queue name [cite: 45]
    }),
  ],
  providers: [RegistrationProcessor], // Our worker
  exports: [BullModule], // Export so other modules can add jobs
})
export class QueueModule {}