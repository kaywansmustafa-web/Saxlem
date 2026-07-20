import { Injectable } from '@nestjs/common';
import type { AppointmentProjection } from '../domain/appointment';
import type { AppointmentResponseDto } from './appointment.dto';
@Injectable()
export class AppointmentDtoMapper {
  map(source: AppointmentProjection): AppointmentResponseDto {
    return {
      id: source.id,
      reference: source.reference,
      clinicId: source.clinicId,
      clinicName: source.clinicName,
      doctorId: source.doctorId,
      doctorName: source.doctorName,
      patientProfileId: source.patientProfileId,
      patientName: source.patientName,
      type: source.type,
      reason: source.reason,
      startsAt: source.startsAt,
      endsAt: source.endsAt,
      durationMinutes: source.durationMinutes,
      feeIqd: source.feeIqd,
      status: source.status,
      cancellationReason: source.cancellationReason,
      version: source.version,
    };
  }
}
