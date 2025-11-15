import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }

  async onModuleInit() {
    // Connect the client when the module starts
    await this.$connect();
  }

  async onModuleDestroy() {
    // Disconnect the client when the module closes
    await this.$disconnect();
  }
}