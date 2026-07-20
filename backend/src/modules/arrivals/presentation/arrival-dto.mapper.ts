import { Injectable } from '@nestjs/common';
import type { ArrivalProjection } from '../domain/arrival';
import type { ArrivalResponseDto } from './arrival.dto';

@Injectable()
export class ArrivalDtoMapper {
  map(value: ArrivalProjection): ArrivalResponseDto {
    return {
      id: value.id,
      appointmentId: value.appointmentId,
      appointmentReference: value.appointmentReference,
      clinicId: value.clinicId,
      clinicName: value.clinicName,
      doctorId: value.doctorId,
      doctorName: value.doctorName,
      patientProfileId: value.patientProfileId,
      patientName: value.patientName,
      appointmentStartsAt: value.appointmentStartsAt,
      status: value.status,
      arrivedAt: value.arrivedAt,
      queueReadyAt: value.queueReadyAt,
      version: value.version,
    };
  }
}
