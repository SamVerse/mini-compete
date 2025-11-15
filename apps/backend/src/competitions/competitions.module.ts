import { Module } from '@nestjs/common';
import { CompetitionsService } from './competitions/competitions.service';
import { CompetitionsController } from './competitions/competitions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CompetitionsService],
  controllers: [CompetitionsController]
})
export class CompetitionsModule {}
