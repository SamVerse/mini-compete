import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user/get-user.decorator';
import type { JwtUser } from 'src/auth/decorators/get-user/get-user.decorator';



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
  createCompetition(
    @Body() dto: CreateCompetitionDto,
    @GetUser() user: JwtUser, 
  ) {
    // Now we get the organizerId from the authenticated user
    return this.competitionService.create(dto, user.userId); 
  }

//  GET /api/competitions (Public)
  @Get()
  findAll() {
    return this.competitionService.findAll();
  }
}