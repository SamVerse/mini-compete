import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getMyRegistrations(userId: number) {
    return this.prisma.registration.findMany({
      where: { userId },
      include: {
        competition: {
          select: { id: true, title: true, regDeadline: true },
        },
      },
    });
  }

  async getMyMailbox(userId: number) {
    return this.prisma.mailBox.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
    });
  }
}