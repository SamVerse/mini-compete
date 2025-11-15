import { Controller, Post, Param, UseGuards, ParseIntPipe, HttpCode } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { GetUser  } from 'src/auth/decorators/get-user/get-user.decorator';
import type { JwtUser } from 'src/auth/decorators/get-user/get-user.decorator';



@Controller('competitions/:id/register') // Nested route
export class RegistrationController {
  constructor(private registrationService: RegistrationService) {}

  // 4. POST /api/competitions/:id/register (Participant Only) [cite: 30]
  @Post()
  @HttpCode(201) // [cite: 41]
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARTICIPANT) // [cite: 30]
  register(
    @Param('id', ParseIntPipe) competitionId: number,
    @GetUser() user: JwtUser, // Use our decorator
  ) {
    // Service uses authenticated user [cite: 31]
    return this.registrationService.register(competitionId, user.userId);
  }
}