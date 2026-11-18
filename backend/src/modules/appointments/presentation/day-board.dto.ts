import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

// Staff-only: reception's day board. Kept apart from the patient booking
// DTOs, which must never carry patient names.
export class DayBoardQueryDto {
  @ApiProperty({ format: 'date', example: '2026-11-17' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
}
export class DayBoardAppointmentDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() reference!: string;
  @ApiProperty({ enum: ['patientBooked', 'clinicCreated', 'walkIn'] })
  origin!: 'patientBooked' | 'clinicCreated' | 'walkIn';
  @ApiProperty({
    enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'noShow'],
  })
  status!: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'noShow';
  @ApiProperty() patientName!: string;
  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'On their way: when they should reach reception.',
  })
  onTheWayEta!: string | null;
}
export class DayBoardSlotDto {
  @ApiProperty({ format: 'date-time' }) startsAt!: string;
  @ApiProperty({ format: 'date-time' }) endsAt!: string;
  @ApiProperty({ enum: ['free', 'booked', 'unavailable', 'past'] })
  state!: 'free' | 'booked' | 'unavailable' | 'past';
  @ApiProperty({
    description: 'Free and starting within the next hour (walk-in eligible).',
  })
  walkIn!: boolean;
  @ApiProperty({ type: DayBoardAppointmentDto, nullable: true })
  appointment!: DayBoardAppointmentDto | null;
}
export class DayBoardDoctorDto {
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty() doctorName!: string;
  @ApiProperty({ type: DayBoardSlotDto, isArray: true })
  slots!: DayBoardSlotDto[];
}
export class DayBoardResponseDto {
  @ApiProperty({ format: 'date' }) date!: string;
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty() clinicTimezone!: string;
  @ApiProperty({ type: 'integer' }) durationMinutes!: number;
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
  @ApiProperty({ type: DayBoardDoctorDto, isArray: true })
  doctors!: DayBoardDoctorDto[];
}
