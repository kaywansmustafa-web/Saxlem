import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class ArrivalParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;
}

export class RecordArrivalDto {
  @ApiProperty({
    minimum: 1,
    description:
      'Expected optimistic-concurrency version from the arrival resource.',
  })
  @IsInt()
  @Min(1)
  version!: number;
}

export class ArrivalResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) appointmentId!: string;
  @ApiProperty({ example: 'SX-2026-000001' }) appointmentReference!: string;
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty() clinicName!: string;
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty() doctorName!: string;
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;
  @ApiProperty() patientName!: string;
  @ApiProperty({ format: 'date-time' }) appointmentStartsAt!: string;
  @ApiProperty({
    enum: ['expected', 'arrived', 'queueReady'],
    description:
      'Arrival eligibility only. queueReady does not create or order a queue entry.',
  })
  status!: 'expected' | 'arrived' | 'queueReady';
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  arrivedAt!: string | null;
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  queueReadyAt!: string | null;
  @ApiProperty({ description: 'Required by the arrival record command.' })
  version!: number;
}
