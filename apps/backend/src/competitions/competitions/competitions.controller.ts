import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';


class CreateCompetitionDto {
  title: string;
  description: string;
  tags?: string[];
  capacity: number;
  regDeadline: Date; 
}

@Controller('competitions')
export class CompetitionsController {
  constructor(private competitionService: CompetitionsService) {}

  // 3. POST /api/competitions (Organizer Only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  @Post()
  createCompetition(@Body() dto: CreateCompetitionDto) {
    // NOTE: The organizerId should be pulled from req.user
    // We will pass a dummy organizerId for now and update later when we implement the full DTO/Request structure.
    const DUMMY_ORGANIZER_ID = 1; 
    return this.competitionService.create(dto, DUMMY_ORGANIZER_ID); 
  }

//  GET /api/competitions (Public)
  @Get()
  findAll() {
    return this.competitionService.findAll();
  }
}