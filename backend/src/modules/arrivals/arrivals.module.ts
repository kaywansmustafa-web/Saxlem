import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { IdentityModule } from '../identity/identity.module';
import { ArrivalService } from './application/arrival.service';
import { ARRIVAL_REPOSITORY } from './domain/arrival.repository';
import { PrismaArrivalRepository } from './infrastructure/prisma-arrival.repository';
import { ArrivalDtoMapper } from './presentation/arrival-dto.mapper';
import { ArrivalsController } from './presentation/arrivals.controller';

@Module({
  imports: [IdentityModule, AppointmentsModule],
  controllers: [ArrivalsController],
  providers: [
    ArrivalService,
    ArrivalDtoMapper,
    PrismaArrivalRepository,
    {
      provide: ARRIVAL_REPOSITORY,
      useExisting: PrismaArrivalRepository,
    },
  ],
})
export class ArrivalsModule {}
