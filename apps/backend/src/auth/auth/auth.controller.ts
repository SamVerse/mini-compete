import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';

// Placeholder DTOs based on assignment requirements
class SignUpDto { 
  name: string; 
  email: string; 
  password: string; 
  role: Role; 
}
class LoginDto { 
  email: string; 
  password: string; 
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /api/auth/signup
  @Post('signup')
  signup(@Body() dto: SignUpDto) {
    // NOTE: Use class-validator for real-world validation here
    return this.authService.signup(dto);
  }

  // POST /api/auth/login
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}