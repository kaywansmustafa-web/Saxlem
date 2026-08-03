import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  Matches,
  IsString,
  IsUUID,
  IsOptional,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
export class AppointmentParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() id!: string;
}
export class AppointmentListQueryDto {
  @ApiProperty({ format: 'date-time' }) @IsDateString() from!: string;
  @ApiProperty({ format: 'date-time' }) @IsDateString() to!: string;
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 50,
    default: 25,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 25;
  @ApiPropertyOptional({
    type: 'string',
    minLength: 1,
    maxLength: 1024,
    pattern: '^[\\x21-\\x7e]+$',
    description: 'Opaque pagination cursor containing printable ASCII only.',
  })
  @IsOptional()
  @Length(1, 1024)
  @Matches(/^[\x21-\x7e]+$/)
  cursor?: string;
  @ApiPropertyOptional({
    enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'noShow'],
  })
  @IsOptional()
  @IsEnum(['scheduled', 'confirmed', 'cancelled', 'completed', 'noShow'])
  status?: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'noShow';
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
  @ApiProperty({
    format: 'date-time',
    description: 'UTC instant with Z or an explicit offset.',
  })
  @IsDateString()
  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
  )
  startsAt!: string;
  @ApiProperty({ type: 'integer', minimum: 5, maximum: 480 })
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes!: number;
}
export class UpdateAppointmentDto {
  @ApiProperty() @IsString() @Length(1, 500) reason!: string;
  @ApiProperty({ type: 'integer', minimum: 1 })
  @IsInt()
  @Min(1)
  version!: number;
}
export class CancelAppointmentDto {
  @ApiProperty() @IsString() @Length(1, 500) reason!: string;
  @ApiProperty({ type: 'integer', minimum: 1 })
  @IsInt()
  @Min(1)
  version!: number;
}
export class RescheduleAppointmentDto {
  @ApiProperty({
    format: 'date-time',
    description: 'UTC instant with Z or an explicit offset.',
  })
  @IsDateString()
  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
  )
  startsAt!: string;
  @ApiProperty({ type: 'integer', minimum: 5, maximum: 480 })
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes!: number;
  @ApiProperty({ type: 'integer', minimum: 1 })
  @IsInt()
  @Min(1)
  version!: number;
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
  @ApiProperty({ type: 'integer' }) durationMinutes!: number;
  @ApiProperty({ type: 'integer' }) feeIqd!: number;
  @ApiProperty({
    enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'noShow'],
    description:
      'Foundation lifecycle. Transitions are explicit; no automatic transitions occur.',
  })
  status!: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'noShow';
  @ApiProperty({ type: 'string', nullable: true })
  cancellationReason!: string | null;
  @ApiProperty({
    type: 'integer',
    description: 'Required for optimistic-concurrency commands.',
  })
  version!: number;
}
export class AppointmentPageResponseDto {
  @ApiProperty({ type: AppointmentResponseDto, isArray: true })
  items!: AppointmentResponseDto[];
  @ApiProperty({ type: 'string', nullable: true }) nextCursor!: string | null;
}
