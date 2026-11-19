import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class NotificationIdParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  notificationId!: string;
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ description: 'Opaque session-bound cursor.' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 25,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 25;

  @ApiPropertyOptional({ type: 'boolean', default: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  unreadOnly = false;
}

export class NotificationContextDto {
  @ApiPropertyOptional({ format: 'uuid' })
  appointmentId?: string;

  @ApiPropertyOptional()
  doctorName?: string;

  @ApiPropertyOptional()
  clinicName?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  startsAt?: string;

  @ApiPropertyOptional({ type: 'integer', minimum: 0 })
  ticketNumber?: number;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 0,
    description: 'Patients waiting ahead, for "almost your turn".',
  })
  ahead?: number;
}

export class NotificationItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: 'string', format: 'uuid', nullable: true })
  patientProfileId!: string | null;

  @ApiProperty({ type: 'string', example: '42' })
  deliverySequence!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty({ enum: ['high', 'normal', 'information'] })
  priority!: 'high' | 'normal' | 'information';

  @ApiProperty()
  actionCode!: string;

  @ApiProperty({ format: 'date-time' })
  occurredAt!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  readAt!: string | null;

  @ApiProperty({ type: () => NotificationContextDto, nullable: true })
  context!: NotificationContextDto | null;
}

export class NotificationPageDto {
  @ApiProperty({ type: () => [NotificationItemDto] })
  items!: NotificationItemDto[];

  @ApiProperty({ type: 'string', nullable: true })
  nextCursor!: string | null;
}

export class NotificationReadResponseDto {
  @ApiProperty({ type: () => NotificationItemDto })
  notification!: NotificationItemDto;
}
