import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AdministrationService } from './application/administration.service';
import { ADMINISTRATION_REPOSITORY } from './domain/administration.repository';
import { PrismaAdministrationRepository } from './infrastructure/prisma-administration.repository';
import { AdministrationController } from './presentation/administration.controller';

@Module({
  imports: [IdentityModule],
  controllers: [AdministrationController],
  providers: [
    AdministrationService,
    PrismaAdministrationRepository,
    {
      provide: ADMINISTRATION_REPOSITORY,
      useExisting: PrismaAdministrationRepository,
    },
  ],
})
export class AdministrationModule {}
