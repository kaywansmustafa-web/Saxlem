import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class BillingIdParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() id!: string;
}
export class BillingOrganizationParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
}
export class BillingListQueryDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 50;
  @ApiPropertyOptional({
    type: 'string',
    minLength: 1,
    maxLength: 2048,
    description:
      'Opaque signed actor-, tenant-, filter-, and page-bound cursor.',
  })
  @IsOptional()
  @Matches(/^[\x21-\x7e]{1,2048}$/u)
  cursor?: string;
}
export class BillingOrganizationQueryDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
}
export class AssignBillingPlanDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() planId!: string;
  @ApiProperty({ format: 'date-time' }) @IsDateString() effectiveFrom!: string;
  @ApiPropertyOptional({ type: 'integer', minimum: 1, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedVersion!: number | null;
}
export class FinalizeBillingStatementDto {
  @ApiProperty({ type: 'integer', minimum: 1 })
  @IsInt()
  @Min(1)
  version!: number;
}
export class BillingPlanResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ enum: ['active', 'inactive'] }) status!: 'active' | 'inactive';
  @ApiProperty({ enum: ['IQD'] }) currency!: 'IQD';
  @ApiProperty({ type: 'integer', minimum: 1 }) commissionAmountIqd!: number;
  @ApiProperty() ruleCode!: string;
  @ApiProperty({ type: 'integer', minimum: 1 }) ruleVersion!: number;
  @ApiProperty({ type: 'integer', minimum: 1 }) version!: number;
}
export class OrganizationPlanResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'date-time' }) effectiveFrom!: string;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  effectiveTo!: string | null;
  @ApiProperty({ type: 'integer', minimum: 1 }) version!: number;
  @ApiProperty({ type: BillingPlanResponseDto }) plan!: BillingPlanResponseDto;
}
export class CommissionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty({ format: 'uuid' }) appointmentId!: string;
  @ApiProperty() appointmentReference!: string;
  @ApiProperty() planCode!: string;
  @ApiProperty({ type: 'integer', minimum: 1 }) amountIqd!: number;
  @ApiProperty({ enum: ['IQD'] }) currency!: 'IQD';
  @ApiProperty() ruleCode!: string;
  @ApiProperty({ type: 'integer', minimum: 1 }) ruleVersion!: number;
  @ApiProperty({ type: 'integer', minimum: 1 }) planVersion!: number;
  @ApiProperty({ format: 'date-time' }) completedAt!: string;
  @ApiProperty({ format: 'date-time' }) recognizedAt!: string;
  @ApiProperty({ enum: ['earned', 'reversed'] }) status!: 'earned' | 'reversed';
  @ApiProperty({ type: 'string', format: 'uuid', nullable: true })
  originalCommissionId!: string | null;
}
export class CommissionPageResponseDto {
  @ApiProperty({ type: [CommissionResponseDto] })
  items!: CommissionResponseDto[];
  @ApiProperty({ type: 'string', nullable: true }) nextCursor!: string | null;
}
export class BillingStatementResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'date-time' }) periodStart!: string;
  @ApiProperty({ format: 'date-time' }) periodEnd!: string;
  @ApiProperty({ enum: ['Asia/Baghdad'] }) timezone!: 'Asia/Baghdad';
  @ApiProperty({ enum: ['draft', 'finalized'] }) status!: 'draft' | 'finalized';
  @ApiProperty({ type: 'integer', minimum: 0 }) grossEarnedIqd!: number;
  @ApiProperty({ type: 'integer', minimum: 0 }) reversalsIqd!: number;
  @ApiProperty({ type: 'integer' }) netCommissionIqd!: number;
  @ApiProperty({ type: 'integer', minimum: 0 }) qualifyingCount!: number;
  @ApiProperty({ type: 'integer', minimum: 0 }) reversalCount!: number;
  @ApiProperty({ type: 'integer', minimum: 1 }) version!: number;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  finalizedAt!: string | null;
}

export class BillingStatementLineResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty({ format: 'uuid' }) appointmentId!: string;
  @ApiProperty() appointmentReference!: string;
  @ApiProperty({ format: 'date-time' }) recognizedAt!: string;
  @ApiProperty({ enum: ['earned', 'reversed'] }) status!: 'earned' | 'reversed';
  @ApiProperty({ type: 'integer', minimum: 1 }) amountIqd!: number;
  @ApiProperty({ type: 'integer' }) netAmountIqd!: number;
  @ApiProperty({ enum: ['IQD'] }) currency!: 'IQD';
}

export class BillingClinicBreakdownResponseDto {
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty({ type: 'integer', minimum: 0 }) grossEarnedIqd!: number;
  @ApiProperty({ type: 'integer', minimum: 0 }) reversalsIqd!: number;
  @ApiProperty({ type: 'integer' }) netCommissionIqd!: number;
  @ApiProperty({ type: 'integer', minimum: 0 }) qualifyingCount!: number;
  @ApiProperty({ type: 'integer', minimum: 0 }) reversalCount!: number;
}

export class BillingStatementDetailResponseDto extends BillingStatementResponseDto {
  @ApiProperty({ type: [BillingStatementLineResponseDto] })
  lines!: BillingStatementLineResponseDto[];
  @ApiProperty({ type: [BillingClinicBreakdownResponseDto] })
  clinicBreakdowns!: BillingClinicBreakdownResponseDto[];
}
