import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class StatementListQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Saxlem only; clinic staff always see their organization.',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;
}
export class StatementParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() doctorId!: string;
  @ApiProperty({ type: 'integer', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cycleNumber!: number;
}
export class SettleStatementDto {
  @ApiProperty({
    enum: ['fib', 'cash'],
    description: 'Doctors pay Saxlem in cash; Saxlem pays by FIB or cash.',
  })
  @IsIn(['fib', 'cash'])
  method!: 'fib' | 'cash';
  @ApiProperty({
    type: 'integer',
    description:
      'The net the operator saw: positive Saxlem pays, negative the doctor pays.',
  })
  @IsInt()
  expectedNetPayableIqd!: number;
  @ApiPropertyOptional({
    maxLength: 120,
    description: 'FIB reference or receipt number.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
  @ApiPropertyOptional({
    maxLength: 120,
    description: 'Who handed over or received the money.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  counterpartyName?: string;
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

class StatementSettlementBriefDto {
  @ApiProperty({
    enum: ['fib', 'cash', 'carried'],
    description: 'carried: unpaid, moved into the next statement.',
  })
  method!: 'fib' | 'cash' | 'carried';
  @ApiProperty({ format: 'date-time' }) settledAt!: string;
}
class StatementSettlementDto {
  @ApiProperty({ enum: ['fib', 'cash', 'carried'] })
  method!: 'fib' | 'cash' | 'carried';
  @ApiProperty({ type: 'string', nullable: true })
  carriedIntoStatement!: string | null;
  @ApiProperty({ type: 'string', nullable: true }) reference!: string | null;
  @ApiProperty({ type: 'string', nullable: true })
  counterpartyName!: string | null;
  @ApiProperty({ type: 'string', nullable: true }) note!: string | null;
  @ApiProperty({ format: 'date-time' }) settledAt!: string;
  @ApiProperty({
    type: 'string',
    nullable: true,
    description: 'Null when closed automatically (carried).',
  })
  settledByName!: string | null;
}
export class StatementSummaryDto {
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty() organizationName!: string;
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty() doctorName!: string;
  @ApiProperty({ type: 'integer', minimum: 1 }) cycleNumber!: number;
  @ApiProperty({ example: 'SX-79C55D-007' }) statementNumber!: string;
  @ApiProperty({ format: 'date-time' }) periodStart!: string;
  @ApiProperty({ format: 'date-time' }) periodEnd!: string;
  @ApiProperty({
    enum: ['open', 'due', 'waiting', 'settled'],
    description:
      'open: 30 days still running; due: ready to settle; waiting: an older statement must be settled first.',
  })
  status!: 'open' | 'due' | 'waiting' | 'settled';
  @ApiProperty() canSettle!: boolean;
  @ApiProperty({ enum: ['saxlemPays', 'doctorPays', 'even'] })
  direction!: 'saxlemPays' | 'doctorPays' | 'even';
  @ApiProperty({ type: 'integer' }) grossCollectedIqd!: number;
  @ApiProperty({ type: 'integer' }) clawbackIqd!: number;
  @ApiProperty({ type: 'integer' }) providerFeeIqd!: number;
  @ApiProperty({ type: 'integer' }) commissionIqd!: number;
  @ApiProperty({
    type: 'integer',
    description: 'Unpaid balance from earlier statements (zero or less).',
  })
  carriedInIqd!: number;
  @ApiProperty({ type: 'integer' }) netPayableIqd!: number;
  @ApiProperty({ type: 'integer' }) paymentCount!: number;
  @ApiProperty({ type: 'integer', nullable: true }) chargeCount!: number | null;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    nullable: true,
    description: 'When the doctor should have paid (doctor owes only).',
  })
  dueAt!: string | null;
  @ApiProperty({ type: StatementSettlementBriefDto, nullable: true })
  settlement!: StatementSettlementBriefDto | StatementSettlementDto | null;
}
export class StatementListDto {
  @ApiProperty({ type: [StatementSummaryDto] }) items!: StatementSummaryDto[];
}
class StatementAccountDto {
  @ApiProperty({ type: 'string', nullable: true }) name!: string | null;
  @ApiProperty() numberHint!: string;
}
class StatementVisitsDto {
  @ApiProperty({ type: 'integer' }) total!: number;
  @ApiProperty({ type: 'integer' }) completed!: number;
  @ApiProperty({ type: 'integer' }) noShow!: number;
  @ApiProperty({ type: 'integer' }) cancelled!: number;
  @ApiProperty({ type: 'integer' }) upcoming!: number;
  @ApiProperty({ type: 'integer' }) app!: number;
  @ApiProperty({ type: 'integer' }) phone!: number;
  @ApiProperty({ type: 'integer' }) walkIn!: number;
}
class StatementRevenueDto {
  @ApiProperty({ type: 'integer' }) totalIqd!: number;
  @ApiProperty({ type: 'integer' }) counterIqd!: number;
  @ApiProperty({ type: 'integer' }) counterCount!: number;
  @ApiProperty({ type: 'integer' }) onlineIqd!: number;
  @ApiProperty({ type: 'integer' }) onlineCount!: number;
}
class StatementChargeDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'date-time' }) recognizedAt!: string;
  @ApiProperty() appointmentReference!: string;
  @ApiProperty({ format: 'date-time' }) appointmentStartsAt!: string;
  @ApiProperty() clinicName!: string;
  @ApiProperty() planName!: string;
  @ApiProperty({ type: 'integer', description: 'Negative for a credit.' })
  amountIqd!: number;
  @ApiProperty({ enum: ['charge', 'credit'] }) kind!: 'charge' | 'credit';
  @ApiProperty({ type: 'string', nullable: true }) reason!: string | null;
}
class StatementMoneyDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'date-time' }) at!: string;
  @ApiProperty() appointmentReference!: string;
  @ApiProperty({ type: 'integer' }) amountIqd!: number;
}
class StatementCarriedDto {
  @ApiProperty() statementNumber!: string;
  @ApiProperty({ type: 'integer' }) cycleNumber!: number;
  @ApiProperty({ type: 'integer', description: 'Negative: the doctor owed.' })
  amountIqd!: number;
}
export class CollectionItemDto {
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty() organizationName!: string;
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty() doctorName!: string;
  @ApiProperty({
    enum: ['clear', 'due', 'overdue', 'warning', 'hidden'],
    description:
      'due: reminders; overdue: carried into the next statement; warning: will be hidden from the app on hideOn; hidden: hidden until paid.',
  })
  stage!: 'clear' | 'due' | 'overdue' | 'warning' | 'hidden';
  @ApiProperty({ type: 'integer' }) owedIqd!: number;
  @ApiProperty({ type: 'integer', nullable: true }) cycleNumber!: number | null;
  @ApiProperty({ type: 'string', nullable: true })
  statementNumber!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  dueAt!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  warnOn!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  hideOn!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  hiddenAt!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  graceUntil!: string | null;
}
export class CollectionListDto {
  @ApiProperty({ type: [CollectionItemDto] }) items!: CollectionItemDto[];
}
export class CollectionDoctorParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() doctorId!: string;
}
export class StatementDocumentDto extends StatementSummaryDto {
  @ApiProperty({ format: 'date-time' }) issuedAt!: string;
  @ApiProperty({ example: '2026-11-17' }) cycleStart!: string;
  @ApiProperty({ type: [String] }) clinicNames!: string[];
  @ApiProperty({ type: 'integer' }) providerFeeBps!: number;
  @ApiProperty({ type: StatementAccountDto, nullable: true })
  payoutAccount!: StatementAccountDto | null;
  @ApiProperty({ type: StatementVisitsDto }) visits!: StatementVisitsDto;
  @ApiProperty({ type: StatementRevenueDto }) revenue!: StatementRevenueDto;
  @ApiProperty({ type: [StatementChargeDto] }) charges!: StatementChargeDto[];
  @ApiProperty({ type: [StatementMoneyDto] })
  onlinePayments!: StatementMoneyDto[];
  @ApiProperty({ type: [StatementMoneyDto] }) refunds!: StatementMoneyDto[];
  @ApiProperty({ type: [StatementCarriedDto] })
  carriedFrom!: StatementCarriedDto[];
  @ApiProperty({ type: StatementSettlementDto, nullable: true })
  declare settlement: StatementSettlementDto | null;
}
