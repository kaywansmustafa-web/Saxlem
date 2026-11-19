import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const RECEIPT_STATUSES = [
  'paid',
  'refundPending',
  'refunded',
  'refundFailed',
] as const;
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export class ReceiptListQueryDto {
  @ApiPropertyOptional({ description: 'From nextCursor.' })
  @IsOptional()
  @IsString()
  // base64url of "<ISO time>|<uuid>": 82 characters.
  @MaxLength(120)
  cursor?: string;
  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

export class ReceiptAppointmentParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all')
  id!: string;
}

/** What a patient paid for one visit: a receipt they can keep or send on. */
export class ReceiptDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) appointmentId!: string;
  @ApiProperty({
    example: 'SX-2026-000123',
    description: 'The visit reference; one payment per visit.',
  })
  reference!: string;
  @ApiProperty({ description: 'Who the visit was for (a family member too).' })
  patientName!: string;
  @ApiProperty() doctorName!: string;
  @ApiProperty() clinicName!: string;
  @ApiProperty({ type: 'string', nullable: true })
  clinicAddress!: string | null;
  @ApiProperty({ type: 'string', nullable: true })
  clinicPhone!: string | null;
  @ApiProperty({ description: 'The clinic organization that was paid.' })
  organizationName!: string;
  @ApiProperty({ type: 'string', format: 'date-time' })
  visitStartsAt!: string;
  @ApiProperty({ enum: ['counter', 'online'] }) method!: 'counter' | 'online';
  @ApiProperty({ enum: ['fib', 'simulated'], nullable: true })
  provider!: 'fib' | 'simulated' | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
    description: 'The payment id at the provider, for online payments.',
  })
  transactionId!: string | null;
  @ApiProperty({
    enum: ['platform', 'organization'],
    nullable: true,
    description:
      'Online payments only. platform: Saxlem collected the money for the clinic. organization: it went straight to the clinic’s own account. Null for counter payments, which the clinic takes in person.',
  })
  collectedBy!: 'platform' | 'organization' | null;
  @ApiProperty({ type: 'integer', minimum: 1 }) amountIqd!: number;
  @ApiProperty({ enum: ['IQD'] }) currency!: 'IQD';
  @ApiProperty({ enum: RECEIPT_STATUSES }) status!: ReceiptStatus;
  @ApiProperty({ type: 'string', format: 'date-time' }) paidAt!: string;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  refundedAt!: string | null;
}

export class ReceiptPageDto {
  @ApiProperty({ type: ReceiptDto, isArray: true }) items!: ReceiptDto[];
  @ApiProperty({ type: 'string', nullable: true }) nextCursor!: string | null;
}
