import { Injectable } from '@nestjs/common';
import type { BookingOptionsProjection } from '../domain/appointment';
import type { BookingOptionsResponseDto } from './appointment.dto';

@Injectable()
export class BookingOptionsDtoMapper {
  map(source: BookingOptionsProjection): BookingOptionsResponseDto {
    return {
      doctorId: source.doctorId,
      doctorName: source.doctorName,
      organizationId: source.organizationId,
      clinicId: source.clinicId,
      clinicName: source.clinicName,
      clinicTimezone: source.clinicTimezone,
      appointmentType: source.appointmentType,
      durationMinutes: source.durationMinutes,
      feeIqd: source.feeIqd,
      currency: source.currency,
      dateFrom: source.dateFrom,
      dateTo: source.dateTo,
      days: source.days.map((day) => ({
        date: day.date,
        slots: day.slots.map((slot) => ({ ...slot })),
      })),
      generatedAt: source.generatedAt,
    };
  }
}
