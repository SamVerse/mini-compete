import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { RegistrationModule } from './registration/registration.module';
import { QueueModule } from './queue/queue.module';
import { BullModule } from '@nestjs/bull';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { IdempotencyMiddleware } from './idempotency/idempotency.middleware';
import { UserModule } from './user/user.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    JwtModule.register({
      secret: process.env.JWT_SECRET, 
      signOptions: { expiresIn: '60m' },
      global: true, 
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST, 
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    AuthModule,
    PrismaModule,
    CompetitionsModule,
    RegistrationModule,
    QueueModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IdempotencyMiddleware).forRoutes('competitions/:id/register');
  }
}