import { Module } from '@nestjs/common';
import { RegistrationService } from './registration/registration.service';
import { RegistrationController } from './registration/registration.controller';

@Module({
  providers: [RegistrationService],
  controllers: [RegistrationController]
})
export class RegistrationModule {}
