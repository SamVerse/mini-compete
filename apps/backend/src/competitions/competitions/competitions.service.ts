import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

type CreateCompetitionData = {
  title: string;
  description: string;
  tags?: string[];
  capacity: number;
  regDeadline: Date;
};

@Injectable()
export class CompetitionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCompetitionData, organizerId: number) {
    // Create the competition in the database
    return this.prisma.competition.create({
      data: {
        ...data,
        // Ensure capacity and regDeadline are validated as numbers/dates in the DTO
        capacity: Number(data.capacity),
        regDeadline: new Date(data.regDeadline),
        organizerId,
      },
    });
  }

  async findAll() {
    // Fetch all competitions, ordered by registration deadline
    return this.prisma.competition.findMany({
      orderBy: { regDeadline: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        capacity: true,
        regDeadline: true,
        tags: true,
        organizer: { select: { name: true } }
      }
    });
  }
}