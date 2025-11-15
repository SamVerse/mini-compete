import { Module } from '@nestjs/common';
import { CompetitionsService } from './competitions/competitions.service';
import { CompetitionsController } from './competitions/competitions.controller';

@Module({
  providers: [CompetitionsService],
  controllers: [CompetitionsController]
})
export class CompetitionsModule {}
