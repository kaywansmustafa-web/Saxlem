import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
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
  ValidateIf,
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
  @Type(() => Number)
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
  @ApiPropertyOptional({ format: 'uuid', description: 'One doctor only.' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;
}
export class BillingOrganizationQueryDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
  @ApiPropertyOptional({ format: 'uuid', description: 'One doctor only.' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;
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
  @ApiProperty({ type: 'integer', minimum: 0 }) commissionAmountIqd!: number;
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
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty() doctorName!: string;
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
  @ApiProperty({
    type: 'string',
    nullable: true,
    description: 'Why a credit was given.',
  })
  reason!: string | null;
}
export class CommissionPageResponseDto {
  @ApiProperty({ type: [CommissionResponseDto] })
  items!: CommissionResponseDto[];
  @ApiProperty({ type: 'string', nullable: true }) nextCursor!: string | null;
}
export class BillingStatementResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    nullable: true,
    description:
      'Each doctor is billed separately. Null only on clinic-wide statements finalized before 2026-11-17.',
  })
  doctorId!: string | null;
  @ApiProperty({ type: 'string', nullable: true }) doctorName!: string | null;
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

const DAY = /^\d{4}-\d{2}-\d{2}$/u;
export class CreateBillingPlanDto {
  @ApiProperty({ minLength: 1, maxLength: 80 })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName!: string;
  @ApiProperty({
    type: 'integer',
    minimum: 0,
    maximum: 1000000,
    description: 'Charged per qualifying visit; 0 makes a free plan.',
  })
  @IsInt()
  @Min(0)
  @Max(1000000)
  commissionAmountIqd!: number;
}
export class BillingPlanStatusDto {
  @ApiProperty({ enum: ['active', 'inactive'] })
  @IsIn(['active', 'inactive'])
  status!: 'active' | 'inactive';
}
export class BillingDoctorParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() doctorId!: string;
}
export class AssignDoctorPlanDto {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    nullable: true,
    description: 'Null goes back to the organization plan.',
  })
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  planId!: string | null;
  @ApiProperty({ example: '2026-11-18', description: 'Baghdad day it starts.' })
  @Matches(DAY)
  from!: string;
}
export class AssignOrganizationPlanByDayDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() planId!: string;
  @ApiProperty({ example: '2026-11-18', description: 'Baghdad day it starts.' })
  @Matches(DAY)
  from!: string;
}
export class BillingCycleStartDto {
  @ApiProperty({
    example: '2026-11-17',
    description: 'Day the first clinic was listed in the app.',
  })
  @Matches(DAY)
  startDate!: string;
}
export class CreditCommissionDto {
  @ApiProperty({ minLength: 1, maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}
export class BillingCycleDto {
  @ApiProperty({ type: 'integer', minimum: 1 }) number!: number;
  @ApiProperty({ format: 'date-time' }) start!: string;
  @ApiProperty({ format: 'date-time' }) end!: string;
}
export class DoctorPlanAssignmentDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty({ format: 'date-time' }) effectiveFrom!: string;
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  effectiveTo!: string | null;
  @ApiProperty({ type: BillingPlanResponseDto }) plan!: BillingPlanResponseDto;
}
export class DoctorBillingSetupDto {
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty() doctorName!: string;
  @ApiProperty({ type: DoctorPlanAssignmentDto, nullable: true })
  ownPlan!: DoctorPlanAssignmentDto | null;
  @ApiProperty({ type: DoctorPlanAssignmentDto, nullable: true })
  upcomingOwnPlan!: DoctorPlanAssignmentDto | null;
  @ApiProperty({ type: BillingPlanResponseDto, nullable: true })
  effectivePlan!: BillingPlanResponseDto | null;
}
export class BillingSetupDto {
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty() organizationName!: string;
  @ApiProperty({ example: '2026-11-17' }) cycleStart!: string;
  @ApiProperty({ type: BillingCycleDto }) currentCycle!: BillingCycleDto;
  @ApiProperty({ type: OrganizationPlanResponseDto, nullable: true })
  plan!: OrganizationPlanResponseDto | null;
  @ApiProperty({ type: OrganizationPlanResponseDto, nullable: true })
  upcomingPlan!: OrganizationPlanResponseDto | null;
  @ApiProperty({ type: [DoctorBillingSetupDto] })
  doctors!: DoctorBillingSetupDto[];
}
