import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module'; // <-- Import QueueModule
import { TasksService } from './tasks/tasks.service';

@Module({
  imports: [PrismaModule, QueueModule], // <-- Add modules
  providers: [TasksService],
})
export class TasksModule {}