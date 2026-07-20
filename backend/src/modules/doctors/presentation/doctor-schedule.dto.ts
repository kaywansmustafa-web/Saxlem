import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID } from 'class-validator';
import type { PublicAvailabilityState } from '../domain/doctor-schedule';

export class ScheduleQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Clinic to evaluate. Staff are restricted to their authenticated clinic.',
  })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description:
      'UTC instant to evaluate. Defaults to the current instant. Conversion occurs in the clinic IANA timezone.',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  at?: string;
}

export class ClinicParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() id!: string;
}

export class LocalPeriodResponseDto {
  @ApiProperty({
    minimum: 0,
    maximum: 6,
    description:
      'Sunday is 0. Periods never cross midnight; split overnight work into two weekday rows.',
  })
  weekday!: number;
  @ApiProperty({ example: '08:00' }) startsAt!: string;
  @ApiProperty({
    example: '16:00',
    description:
      'Exclusive local end. 24:00 is permitted only as the end of a same-day row.',
  })
  endsAt!: string;
}

export class UtcPeriodResponseDto {
  @ApiProperty({ format: 'date-time' }) startsAt!: string;
  @ApiProperty({ format: 'date-time' }) endsAt!: string;
}

export class HolidayResponseDto extends UtcPeriodResponseDto {
  @ApiProperty({ example: 'Newroz' }) name!: string;
}

export class ScheduleExceptionResponseDto extends UtcPeriodResponseDto {
  @ApiProperty({ enum: ['working', 'closed'] }) kind!: 'working' | 'closed';
}

export class ClinicScheduleResponseDto {
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty() clinicName!: string;
  @ApiProperty({ example: 'Asia/Baghdad' }) timezone!: string;
  @ApiProperty({ type: LocalPeriodResponseDto, isArray: true })
  clinicWorkingHours!: LocalPeriodResponseDto[];
  @ApiProperty({ type: LocalPeriodResponseDto, isArray: true })
  weeklyWorkingHours!: LocalPeriodResponseDto[];
  @ApiProperty({ type: LocalPeriodResponseDto, isArray: true })
  breaks!: LocalPeriodResponseDto[];
  @ApiProperty({ type: UtcPeriodResponseDto, isArray: true })
  leave!: UtcPeriodResponseDto[];
  @ApiProperty({ type: HolidayResponseDto, isArray: true })
  holidays!: HolidayResponseDto[];
  @ApiProperty({ type: ScheduleExceptionResponseDto, isArray: true })
  exceptions!: ScheduleExceptionResponseDto[];
}

export class DoctorScheduleResponseDto {
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty() doctorName!: string;
  @ApiProperty({ type: ClinicScheduleResponseDto, isArray: true })
  clinics!: ClinicScheduleResponseDto[];
}

export class ClinicAvailabilityResponseDto {
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty() clinicName!: string;
  @ApiProperty({ example: 'Asia/Baghdad' }) timezone!: string;
  @ApiProperty({ format: 'date', example: '2026-07-20' }) localDate!: string;
  @ApiProperty({
    enum: ['workingToday', 'closedToday', 'unavailable'],
    description:
      'Patient-safe descriptive availability; internal causes are not exposed.',
  })
  status!: PublicAvailabilityState;
  @ApiProperty() isWorkingNow!: boolean;
}

export class ScheduleAvailabilityResponseDto {
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty({ format: 'date-time' }) evaluatedAt!: string;
  @ApiProperty({ type: ClinicAvailabilityResponseDto, isArray: true })
  clinics!: ClinicAvailabilityResponseDto[];
}

export class ClinicHoursResponseDto {
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty() clinicName!: string;
  @ApiProperty({ example: 'Asia/Baghdad' }) timezone!: string;
  @ApiProperty({ type: LocalPeriodResponseDto, isArray: true })
  workingHours!: LocalPeriodResponseDto[];
}
