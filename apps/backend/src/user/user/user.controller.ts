import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { GetUser } from 'src/auth/decorators/get-user/get-user.decorator';
// import { GetUser, JwtUser } from '../auth/decorators/get-user.decorator';
import type { JwtUser } from 'src/auth/decorators/get-user/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';


@Controller('users')
@UseGuards(JwtAuthGuard) // Protect all user routes
export class UserController {
  constructor(private userService: UserService) {}

  // GET /api/users/me/registrations [cite: 42]
  @Get('me/registrations')
  getMyRegistrations(@GetUser() user: JwtUser) {
    return this.userService.getMyRegistrations(user.userId);
  }

  // GET /api/users/me/mailbox (For frontend)
  @Get('me/mailbox')
  getMyMailbox(@GetUser() user: JwtUser) {
    return this.userService.getMyMailbox(user.userId);
  }
}