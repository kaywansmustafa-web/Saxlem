import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class QueueIdParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;
}
export class QueueCurrentParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  clinicId!: string;
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  doctorId!: string;
}
export class QueueAppointmentParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  appointmentId!: string;
}
export class QueueEntryParamsDto extends QueueIdParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  entryId!: string;
}
export class QueueVersionDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  version!: number;
}
export class EnqueueDto extends QueueVersionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  appointmentId!: string;
}
export class PauseQueueDto extends QueueVersionDto {
  @ApiPropertyOptional({ maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  reason?: string;
}
export class EntryCommandDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  sessionVersion!: number;
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  entryVersion!: number;
}
export class StaffQueueEntryResponseDto {
  @ApiProperty({ format: 'uuid' }) entryId!: string;
  @ApiProperty({ format: 'uuid' }) queueSessionId!: string;
  @ApiProperty({ format: 'uuid' }) appointmentId!: string;
  @ApiProperty({ example: 'SX-2026-000001' }) appointmentReference!: string;
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;
  @ApiProperty() patientDisplayName!: string;
  @ApiProperty({ type: 'integer', minimum: 1 })
  ticketNumber!: number;
  @ApiProperty({
    enum: [
      'waiting',
      'called',
      'inConsultation',
      'completed',
      'noResponse',
      'removed',
    ],
  })
  status!: string;
  @ApiProperty({ format: 'date-time' }) enqueuedAt!: string;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  calledAt!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  consultationStartedAt!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  completedAt!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  noResponseAt!: string | null;
  @ApiProperty({ type: 'integer', minimum: 1 })
  version!: number;
}
export class QueueDoctorReferenceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  name!: string;
}
export class QueueClinicReferenceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  name!: string;
}
export class QueueResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty({ enum: ['notStarted', 'open', 'paused', 'closed'] })
  status!: string;
  @ApiProperty({ type: 'integer', minimum: 1 })
  version!: number;
  @ApiProperty({ type: 'integer', minimum: 0, maximum: 50 })
  waitingCount!: number;
  @ApiProperty({ type: 'string', format: 'date' })
  operationalDate!: string;
  @ApiProperty({ example: 'Asia/Baghdad' })
  effectiveTimezone!: string;
  @ApiProperty({ type: () => StaffQueueEntryResponseDto, nullable: true })
  currentPatient!: StaffQueueEntryResponseDto | null;
  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
export class QueueEnqueueResponseDto {
  @ApiProperty({ type: () => StaffQueueEntryResponseDto })
  entry!: StaffQueueEntryResponseDto;
  @ApiProperty({ type: () => QueueResponseDto })
  queue!: QueueResponseDto;
}
export class QueueEntriesQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 25;

  @ApiPropertyOptional({ description: 'Opaque session-bound cursor.' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  includeTerminal: boolean = false;
}
export class QueueEntriesPageResponseDto {
  @ApiProperty({ type: [StaffQueueEntryResponseDto] })
  items!: StaffQueueEntryResponseDto[];
  @ApiProperty({ type: String, nullable: true })
  nextCursor!: string | null;
}
export class PatientQueueStatusResponseDto {
  @ApiProperty({ enum: ['notStarted', 'open', 'paused', 'closed'] })
  queueState!: string;
  @ApiProperty({ minimum: 1 })
  ticketNumber!: number;
  @ApiProperty({ type: 'integer', nullable: true, minimum: 1 })
  currentTicket!: number | null;
  @ApiProperty({ minimum: 0 })
  patientsAhead!: number;
  @ApiProperty({ enum: ['healthy', 'busy', 'delayed'] })
  queueHealth!: string;
  @ApiProperty()
  instruction!: string;
  @ApiProperty({
    nullable: true,
    type: 'object',
    properties: {
      minimumMinutes: { type: 'integer', minimum: 0 },
      maximumMinutes: { type: 'integer', minimum: 0 },
    },
  })
  estimatedWait!: {
    minimumMinutes: number;
    maximumMinutes: number;
  } | null;
  @ApiProperty()
  estimateSuspended!: boolean;
  @ApiProperty({ type: () => QueueDoctorReferenceResponseDto })
  doctor!: QueueDoctorReferenceResponseDto;
  @ApiProperty({ type: () => QueueClinicReferenceResponseDto })
  clinic!: QueueClinicReferenceResponseDto;
  @ApiProperty()
  appointmentReference!: string;
  @ApiProperty()
  status!: string;
  @ApiProperty({ format: 'date-time' })
  lastUpdatedAt!: string;
}
