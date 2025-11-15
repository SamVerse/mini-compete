import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

// Define the shape of data passed into the functions (DTOs would be better later)
type SignUpDto = { name: string, email: string, password: string, role: Role };
type LoginDto = { email: string, password: string };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async signToken(userId: number, email: string, role: Role): Promise<{ token: string }> {
    const payload = { sub: userId, email, role };
    return {
      token: await this.jwtService.signAsync(payload),
    };
  }

  async signup(dto: SignUpDto) {
    // 1. Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists.');
    }

    // 2. Hash password and save
    const hashedPassword = await this.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
      },
    });

    // 3. Return JWT
    return this.signToken(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    // 1. Find user
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // 3. Return JWT
    return this.signToken(user.id, user.email, user.role);
  }
}