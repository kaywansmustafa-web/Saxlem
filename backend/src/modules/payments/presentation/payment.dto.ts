import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const statuses = [
  'dueAtCounter',
  'pending',
  'paid',
  'expired',
  'cancelled',
  'refundPending',
  'refunded',
  'refundFailed',
  'void',
] as const;

export class PaymentAppointmentParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;
}

export class PaymentOptionsQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  clinicId!: string;
}

export class PaymentListQueryDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Appointment ids (1 to 100). Repeat the parameter.',
  })
  @Transform(({ value }: { value: unknown }): unknown[] =>
    Array.isArray(value) ? (value as unknown[]) : [value],
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  appointmentId!: string[];
}

export class ChoosePaymentDto {
  @ApiProperty({
    enum: ['counter', 'online'],
    description:
      'counter: pay the receptionist in person. online: pay in the app into the clinic’s own account.',
  })
  @IsIn(['counter', 'online'])
  method!: 'counter' | 'online';
}

export class PaymentCallbackParamsDto {
  @ApiProperty()
  @IsString()
  @MinLength(32)
  @MaxLength(64)
  token!: string;
}

export class OrganizationPaymentParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;
}

export class DoctorPayoutParamsDto extends OrganizationPaymentParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  doctorId!: string;
}

export class SaveDoctorPayoutProfileDto {
  @ApiPropertyOptional({ maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  payoutAccountName?: string | null;
  @ApiPropertyOptional({
    minLength: 4,
    maxLength: 64,
    nullable: true,
    description: "FIB account number or IBAN for the doctor's payouts.",
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9 ]{4,64}$/)
  payoutAccountNumber?: string | null;
}

export class DoctorPayoutProfileDto {
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty({ type: 'string', nullable: true })
  payoutAccountName!: string | null;
  @ApiProperty({ type: 'string', nullable: true })
  payoutAccountNumberHint!: string | null;
  @ApiProperty({ type: 'integer' }) version!: number;
}

export class SavePaymentAccountDto {
  @ApiProperty({ enum: ['fib', 'simulated'] })
  @IsIn(['fib', 'simulated'])
  provider!: 'fib' | 'simulated';
  @ApiProperty({ enum: ['stage', 'prod', 'simulated'] })
  @IsIn(['stage', 'prod', 'simulated'])
  environment!: 'stage' | 'prod' | 'simulated';
  @ApiProperty({ minLength: 1, maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  clientId!: string;
  @ApiProperty({ minLength: 8, maxLength: 500, writeOnly: true })
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  clientSecret!: string;
  @ApiProperty()
  @IsBoolean()
  onlineEnabled!: boolean;
}

export class PaymentOnlineDetailsDto {
  @ApiProperty({ type: 'string', nullable: true, example: 'AB12-CD34' })
  readableCode!: string | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
    description: 'PNG data URL to scan with the provider app.',
  })
  qrCode!: string | null;
  @ApiProperty({ type: 'string', nullable: true }) personalAppLink!:
    string | null;
  @ApiProperty({ type: 'string', nullable: true }) businessAppLink!:
    string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  validUntil!: string | null;
}

export class PaymentResponseDto {
  @ApiProperty({ format: 'uuid' }) appointmentId!: string;
  @ApiProperty({ enum: ['counter', 'online'] }) method!: 'counter' | 'online';
  @ApiProperty({ enum: statuses }) status!: (typeof statuses)[number];
  @ApiProperty({ type: 'integer', minimum: 1 }) amountIqd!: number;
  @ApiProperty({ enum: ['IQD'] }) currency!: 'IQD';
  @ApiProperty({ enum: ['fib', 'simulated'], nullable: true })
  provider!: 'fib' | 'simulated' | null;
  @ApiProperty({ description: 'Whether paying in the app is possible now.' })
  onlineAvailable!: boolean;
  @ApiProperty({ type: () => PaymentOnlineDetailsDto, nullable: true })
  online!: PaymentOnlineDetailsDto | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  paidAt!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  refundedAt!: string | null;
  @ApiProperty({
    type: 'integer',
    minimum: 0,
    description:
      '0 when the patient has not chosen yet (defaults to the counter).',
  })
  version!: number;
}

export class PaymentListResponseDto {
  @ApiProperty({ type: () => [PaymentResponseDto] })
  items!: PaymentResponseDto[];
}

export class PaymentOptionsResponseDto {
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty({ enum: ['counter', 'online'], isArray: true })
  methods!: ('counter' | 'online')[];
  @ApiProperty({ enum: ['fib', 'simulated'], nullable: true })
  onlineProvider!: 'fib' | 'simulated' | null;
  @ApiProperty({ enum: ['IQD'] }) currency!: 'IQD';
}

export class PaymentAccountResponseDto {
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty() connected!: boolean;
  @ApiProperty({ enum: ['fib', 'simulated'], nullable: true })
  provider!: 'fib' | 'simulated' | null;
  @ApiProperty({ type: 'string', nullable: true }) environment!: string | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
    description:
      'Last four characters of the client id. Secrets are never returned.',
  })
  clientIdHint!: string | null;
  @ApiProperty() onlineEnabled!: boolean;
  @ApiProperty({
    description: 'Whether online payments are switched on for the platform.',
  })
  platformOnlineEnabled!: boolean;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  updatedAt!: string | null;
}

export class MonthQueryDto {
  @ApiProperty({ example: '2026-11', description: 'Baghdad calendar month.' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month!: string;
}

export class LedgerQueryDto extends MonthQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
  @ApiPropertyOptional({ enum: ['counter', 'online'] })
  @IsOptional()
  @IsIn(['counter', 'online'])
  method?: 'counter' | 'online';
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cursor?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class SettlePayoutDto extends MonthQueryDto {
  @ApiProperty({
    type: 'integer',
    description:
      'Net amount shown to the operator. Settling fails if the amounts changed.',
  })
  @IsInt()
  expectedNetPayableIqd!: number;
  @ApiProperty({
    minLength: 1,
    maxLength: 120,
    description: 'Transfer reference, for example the FIB transaction ID.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  reference!: string;
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class SavePayoutProfileDto {
  @ApiProperty({
    description: 'Patients of this organization can pay in the app.',
  })
  @IsBoolean()
  onlinePaymentsEnabled!: boolean;
  @ApiPropertyOptional({ maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  payoutAccountName?: string | null;
  @ApiPropertyOptional({
    minLength: 4,
    maxLength: 64,
    nullable: true,
    description: 'FIB account number or IBAN Saxlem pays out to.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9 ]{4,64}$/)
  payoutAccountNumber?: string | null;
}

export class LedgerEntryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) appointmentId!: string;
  @ApiProperty() appointmentReference!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty() organizationName!: string;
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty() clinicName!: string;
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty() doctorName!: string;
  @ApiProperty() patientName!: string;
  @ApiProperty({ format: 'date-time' }) bookedAt!: string;
  @ApiProperty({ format: 'date-time' }) appointmentStartsAt!: string;
  @ApiProperty({ enum: ['counter', 'online'] }) method!: string;
  @ApiProperty({ type: 'integer' }) amountIqd!: number;
  @ApiProperty({ enum: statuses }) status!: string;
  @ApiProperty({ enum: ['platform', 'organization'], nullable: true })
  collectedBy!: string | null;
  @ApiProperty({ enum: ['fib', 'simulated'], nullable: true })
  provider!: string | null;
  @ApiProperty({
    type: 'string',
    nullable: true,
    description: 'Name on the paying FIB account.',
  })
  payerName!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  paidAt!: string | null;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  refundedAt!: string | null;
  @ApiProperty({ type: 'string', format: 'uuid', nullable: true })
  payoutId!: string | null;
}

export class LedgerResponseDto {
  @ApiProperty({ type: () => [LedgerEntryDto] }) items!: LedgerEntryDto[];
  @ApiProperty({ type: 'string', format: 'uuid', nullable: true })
  nextCursor!: string | null;
}

export class PayoutSettlementDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() reference!: string;
  @ApiProperty({ type: 'string', nullable: true }) note!: string | null;
  @ApiProperty({ format: 'date-time' }) settledAt!: string;
}

export class PayoutAccountHintDto {
  @ApiProperty({ type: 'string', nullable: true }) name!: string | null;
  @ApiProperty() numberHint!: string;
}

export class PayoutDto {
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty() organizationName!: string;
  @ApiProperty({
    format: 'uuid',
    description: 'Each doctor is billed and paid separately.',
  })
  doctorId!: string;
  @ApiProperty() doctorName!: string;
  @ApiProperty({ format: 'date-time' }) periodStart!: string;
  @ApiProperty({ format: 'date-time' }) periodEnd!: string;
  @ApiProperty({
    enum: ['open', 'ready', 'settled'],
    description: 'open: month not over. ready: can be settled. settled: done.',
  })
  status!: 'open' | 'ready' | 'settled';
  @ApiProperty({ type: 'integer' }) grossCollectedIqd!: number;
  @ApiProperty({
    type: 'integer',
    description: 'Refunds of payments already paid out, taken back.',
  })
  clawbackIqd!: number;
  @ApiProperty({ type: 'integer' }) providerFeeIqd!: number;
  @ApiProperty({ type: 'integer' }) commissionIqd!: number;
  @ApiProperty({
    type: 'integer',
    description:
      'Positive: Saxlem pays the doctor. Negative: the doctor owes Saxlem.',
  })
  netPayableIqd!: number;
  @ApiProperty({ type: 'integer' }) paymentCount!: number;
  @ApiProperty({ type: () => PayoutSettlementDto, nullable: true })
  settlement!: PayoutSettlementDto | null;
  @ApiProperty({ type: () => PayoutAccountHintDto, nullable: true })
  payoutAccount!: PayoutAccountHintDto | null;
}

export class PayoutSummaryDto {
  @ApiProperty() month!: string;
  @ApiProperty({ format: 'date-time' }) periodStart!: string;
  @ApiProperty({ format: 'date-time' }) periodEnd!: string;
  @ApiProperty() monthEnded!: boolean;
  @ApiProperty({ type: () => [PayoutDto] }) items!: PayoutDto[];
}

export class PayoutProfileDto {
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty() onlinePaymentsEnabled!: boolean;
  @ApiProperty({ type: 'string', nullable: true })
  payoutAccountName!: string | null;
  @ApiProperty({ type: 'string', nullable: true })
  payoutAccountNumberHint!: string | null;
  @ApiProperty({ type: 'integer' }) version!: number;
}

export class PlatformAccountDto {
  @ApiProperty({ enum: ['fib', 'simulated'] }) provider!: string;
  @ApiProperty() environment!: string;
  @ApiProperty() clientIdHint!: string;
}

export class PaymentSettingsDto {
  @ApiProperty({ enum: ['platform', 'clinic'] }) collectionMode!: string;
  @ApiProperty() onlineEnabled!: boolean;
  @ApiProperty({ type: () => PlatformAccountDto, nullable: true })
  platformAccount!: PlatformAccountDto | null;
  @ApiProperty({ type: 'integer' }) providerFeeBps!: number;
  @ApiProperty() feePassedToClinic!: boolean;
}
