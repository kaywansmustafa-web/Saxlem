import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
export class AppointmentParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() id!: string;
}
export class CreateAppointmentDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() clinicId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() doctorId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() patientProfileId!: string;
  @ApiProperty({ enum: ['initial', 'followUp'] })
  @IsEnum(['initial', 'followUp'])
  type!: 'initial' | 'followUp';
  @ApiProperty() @IsString() @Length(1, 500) reason!: string;
  @ApiProperty({ format: 'date-time' }) @IsDateString() startsAt!: string;
  @ApiProperty({ minimum: 5, maximum: 480 })
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes!: number;
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) feeIqd!: number;
}
export class UpdateAppointmentDto {
  @ApiProperty() @IsString() @Length(1, 500) reason!: string;
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) version!: number;
}
export class CancelAppointmentDto {
  @ApiProperty() @IsString() @Length(1, 500) reason!: string;
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) version!: number;
}
export class RescheduleAppointmentDto {
  @ApiProperty({ format: 'date-time' }) @IsDateString() startsAt!: string;
  @ApiProperty({ minimum: 5, maximum: 480 })
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes!: number;
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) version!: number;
}
export class AppointmentResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'SX-2026-000001' }) reference!: string;
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty() clinicName!: string;
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty() doctorName!: string;
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;
  @ApiProperty() patientName!: string;
  @ApiProperty({ enum: ['initial', 'followUp'] }) type!: 'initial' | 'followUp';
  @ApiProperty() reason!: string;
  @ApiProperty({ format: 'date-time' }) startsAt!: string;
  @ApiProperty({ format: 'date-time' }) endsAt!: string;
  @ApiProperty() durationMinutes!: number;
  @ApiProperty() feeIqd!: number;
  @ApiProperty({
    enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'noShow'],
    description:
      'Foundation lifecycle. Transitions are explicit; no automatic transitions occur.',
  })
  status!: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'noShow';
  @ApiPropertyOptional({ nullable: true }) cancellationReason!: string | null;
  @ApiProperty({ description: 'Required for optimistic-concurrency commands.' })
  version!: number;
}
