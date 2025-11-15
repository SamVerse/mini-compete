import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module'; // Import QueueModule
import { RegistrationController } from './registration/registration.controller';
import { RegistrationService } from './registration/registration.service';

@Module({
  imports: [PrismaModule, QueueModule], // Add QueueModule
  controllers: [RegistrationController],
  providers: [RegistrationService],
})
export class RegistrationModule {}