import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  IsUUID,
  MaxLength,
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
