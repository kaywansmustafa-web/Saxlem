import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { DoctorDetailResponseDto } from '../../doctors/presentation/doctor.dto';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PlatformPageQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 25,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 25;
  @ApiPropertyOptional({ type: 'string', maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  cursor?: string;
  @ApiPropertyOptional({ type: 'string', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;
}

export class StaffListQueryDto extends PlatformPageQueryDto {
  @ApiPropertyOptional({
    enum: ['receptionist', 'doctor', 'clinicManager', 'platformAdministrator'],
  })
  @IsOptional()
  @IsEnum(['receptionist', 'doctor', 'clinicManager', 'platformAdministrator'])
  role?: 'receptionist' | 'doctor' | 'clinicManager' | 'platformAdministrator';
}

export class StaffRoleDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({
    enum: ['receptionist', 'doctor', 'clinicManager', 'platformAdministrator'],
  })
  role!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) organizationId!:
    string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) clinicId!: string | null;
}

export class StaffMembershipDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty() role!: string;
  @ApiProperty({ enum: ['active', 'inactive'] }) status!: string;
  @ApiProperty() organizationName!: string;
  @ApiProperty() clinicName!: string;
}

export class StaffReceptionDoctorDto {
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty() doctorName!: string;
}

export class StaffResponseDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ format: 'uuid' }) staffAccountId!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ enum: ['active', 'inactive'] }) status!: string;
  @ApiProperty({ type: [StaffRoleDto] }) roles!: StaffRoleDto[];
  @ApiProperty({ type: [StaffMembershipDto] })
  memberships!: StaffMembershipDto[];
  @ApiProperty({ format: 'uuid', nullable: true }) doctorId!: string | null;
  @ApiProperty({ nullable: true }) doctorName!: string | null;
  @ApiProperty({
    type: [StaffReceptionDoctorDto],
    description: 'Doctors a receptionist works for, per clinic.',
  })
  receptionDoctors!: StaffReceptionDoctorDto[];
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class StaffPageResponseDto {
  @ApiProperty({ type: [StaffResponseDto] }) items!: StaffResponseDto[];
  @ApiProperty({ type: 'string', nullable: true }) nextCursor!: string | null;
}

export class CreateStaffDto {
  @ApiProperty({ format: 'email' }) @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty({ enum: ['receptionist', 'clinicManager'] })
  @IsEnum(['receptionist', 'clinicManager'])
  role!: 'receptionist' | 'clinicManager';
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() clinicId!: string;
  @ApiPropertyOptional({
    type: 'string',
    format: 'uuid',
    isArray: true,
    description:
      'Receptionists only: the doctor(s) they work for. Usually one.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  doctorIds?: string[];
}
export class CreateStaffResponseDto extends StaffResponseDto {
  @ApiProperty({
    description: 'One-time credential returned only at creation.',
  })
  activationCredential!: string;
  @ApiProperty({ format: 'date-time' }) activationExpiresAt!: string;
}
export class ActivateStaffDto {
  @ApiProperty({ minLength: 43, maxLength: 128 })
  @IsString()
  @Length(43, 128)
  activationCredential!: string;
  @ApiProperty({ minLength: 14, maxLength: 128 })
  @IsString()
  @Length(14, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/u)
  password!: string;
}
export class ActivationResultDto {
  @ApiProperty() activated!: boolean;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: ['active', 'inactive'] })
  @IsEnum(['active', 'inactive'])
  status!: 'active' | 'inactive';
}
export class AddStaffMembershipDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() clinicId!: string;
  @ApiProperty({ enum: ['receptionist', 'clinicManager', 'doctor'] })
  @IsEnum(['receptionist', 'clinicManager', 'doctor'])
  role!: 'receptionist' | 'clinicManager' | 'doctor';
  @ApiPropertyOptional({
    type: 'string',
    format: 'uuid',
    isArray: true,
    description:
      'Receptionists only: the doctor(s) they work for. Usually one.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  doctorIds?: string[];
}

export class PatientSummaryDto {
  @ApiProperty({ format: 'uuid' }) accountId!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() maskedPhone!: string;
  @ApiProperty({ enum: ['active', 'inactive'] }) status!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ type: 'integer' }) profileCount!: number;
  @ApiProperty({ type: 'integer' }) appointmentCount!: number;
  @ApiProperty({ format: 'date-time', nullable: true })
  mostRecentAppointmentAt!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}
export class PatientPageResponseDto {
  @ApiProperty({ type: [PatientSummaryDto] }) items!: PatientSummaryDto[];
  @ApiProperty({ type: 'string', nullable: true }) nextCursor!: string | null;
}
export class PatientProfileAdminDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty({ enum: ['active', 'inactive'] }) status!: string;
  @ApiProperty() relationship!: string;
}
export class PatientDetailResponseDto extends PatientSummaryDto {
  @ApiProperty({ type: [PatientProfileAdminDto] })
  profiles!: PatientProfileAdminDto[];
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: false },
  })
  appointments!: object[];
}

export class LiveOperationDto {
  @ApiProperty({ format: 'uuid' }) queueSessionId!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty() organizationName!: string;
  @ApiProperty({ format: 'uuid' }) clinicId!: string;
  @ApiProperty() clinicName!: string;
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty() doctorName!: string;
  @ApiProperty() operationalDate!: string;
  @ApiProperty() effectiveTimezone!: string;
  @ApiProperty({ enum: ['notStarted', 'open', 'paused', 'closed'] })
  status!: string;
  @ApiProperty({ type: 'integer' }) waitingCount!: number;
  @ApiProperty({ type: 'integer' }) calledCount!: number;
  @ApiProperty({ type: 'integer' }) inConsultationCount!: number;
  @ApiProperty({
    nullable: true,
    description:
      'Initials of the patient in consultation (for example "S. A."), never a full name.',
  })
  currentPatientInitials!: string | null;
  @ApiProperty({ type: 'integer', nullable: true })
  estimatedDelayMinutes!: number | null;
  @ApiProperty({ enum: ['healthy', 'busy', 'delayed', 'paused', 'closed'] })
  health!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class AnalyticsRangeQueryDto {
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  from?: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
export class ExecutiveAnalyticsResponseDto {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'integer' } })
  totals!: Record<string, number>;
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  appointmentTrend!: object[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  commissionTrend!: object[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  patientGrowth!: object[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  clinicGrowth!: object[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  doctorGrowth!: object[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  cancellationTrend!: object[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  noShowTrend!: object[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  busiestClinics!: object[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  busiestDoctors!: object[];
}

export class AuditQueryDto extends PlatformPageQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  action?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  targetType?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  actorId?: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  from?: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
export class AuditEventResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) organizationId!:
    string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) clinicId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) actorUserId!: string | null;
  @ApiProperty() action!: string;
  @ApiProperty() targetType!: string;
  @ApiProperty({ nullable: true }) targetId!: string | null;
  @ApiProperty({ enum: ['succeeded', 'denied', 'failed'] }) outcome!: string;
  @ApiProperty({ nullable: true }) requestId!: string | null;
  @ApiProperty({ format: 'date-time' }) occurredAt!: string;
}
export class AuditEventPageResponseDto {
  @ApiProperty({ type: [AuditEventResponseDto] })
  items!: AuditEventResponseDto[];
  @ApiProperty({ type: 'string', nullable: true }) nextCursor!: string | null;
}

export class SearchQueryDto {
  @ApiProperty({ minLength: 2, maxLength: 80 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 80)
  @Matches(/^[\p{L}\p{N}\p{M}\p{Zs}.'-]+$/u)
  q!: string;
  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 10, default: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit = 5;
}
export class SearchResultDto {
  @ApiProperty() category!: string;
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() label!: string;
  @ApiProperty() description!: string;
  @ApiProperty() href!: string;
}

export class CreateDocumentDto {
  @ApiProperty()
  @IsString()
  @Matches(/^[a-z][a-zA-Z]{1,39}$/)
  entityType!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() entityId!: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;
  @ApiProperty({
    enum: [
      'organization',
      'clinic',
      'doctor',
      'license',
      'billing',
      'statement',
      'legal',
      'report',
      'platform',
    ],
  })
  @IsEnum([
    'organization',
    'clinic',
    'doctor',
    'license',
    'billing',
    'statement',
    'legal',
    'report',
    'platform',
  ])
  category!: string;
  @ApiProperty()
  @IsString()
  @Length(1, 255)
  @Matches(/^[\p{L}\p{N}\p{M}\p{Zs}._()-]+$/u)
  filename!: string;
  @ApiProperty({
    enum: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
  })
  @IsEnum(['application/pdf', 'image/jpeg', 'image/png', 'text/plain'])
  contentType!: string;
  @ApiProperty({ type: 'integer', minimum: 0, maximum: 26214400 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(26214400)
  sizeBytes!: number;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
export class DocumentResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() entityType!: string;
  @ApiProperty({ format: 'uuid' }) entityId!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) organizationId!:
    string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) clinicId!: string | null;
  @ApiProperty() category!: string;
  @ApiProperty() filename!: string;
  @ApiProperty() contentType!: string;
  @ApiProperty({ type: 'integer' }) sizeBytes!: number;
  @ApiProperty() status!: string;
  @ApiProperty({ format: 'date-time', nullable: true }) uploadedAt!:
    string | null;
  @ApiProperty({ format: 'date-time', nullable: true }) expiresAt!:
    string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}

export class DoctorOnboardingDto {
  @ApiProperty({ format: 'email' }) @IsEmail() email!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() clinicId!: string;
  @ApiProperty() @IsString() @Length(1, 80) firstName!: string;
  @ApiProperty() @IsString() @Length(1, 80) lastName!: string;
  @ApiProperty() @IsString() @Length(1, 120) displayName!: string;
  @ApiProperty({ enum: ['female', 'male', 'unspecified'] })
  @IsEnum(['female', 'male', 'unspecified'])
  gender!: string;
  @ApiProperty() @IsString() @Length(2, 80) licenseNumber!: string;
  @ApiProperty({ type: 'integer', minimum: 0, maximum: 80 })
  @IsInt()
  @Min(0)
  @Max(80)
  yearsOfExperience!: number;
  @ApiProperty({ format: 'uuid' }) @IsUUID() specialtyId!: string;
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  languages!: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  biography?: string;
}
export class UpdateDoctorAdminDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 120)
  displayName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  biography?: string;
  @ApiPropertyOptional({ type: 'integer', minimum: 0, maximum: 80 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(80)
  yearsOfExperience?: number;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  languages?: string[];
  @ApiPropertyOptional({ enum: ['active', 'inactive', 'archived'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'archived'])
  status?: string;
  @ApiProperty({ type: 'integer', minimum: 1 })
  @IsInt()
  @Min(1)
  version!: number;
}
export class DoctorMutationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ format: 'email' }) email?: string;
  @ApiPropertyOptional() displayName?: string;
  @ApiPropertyOptional() activationRequired?: boolean;
  @ApiPropertyOptional({
    description: 'One-time credential returned only at creation.',
  })
  activationCredential?: string;
  @ApiPropertyOptional({ format: 'date-time' }) activationExpiresAt?: string;
  @ApiProperty({ type: 'integer' }) version!: number;
}
export class PlatformDoctorDetailResponseDto extends DoctorDetailResponseDto {
  @ApiProperty({ type: 'integer', minimum: 1 }) version!: number;
}
export class PlatformSpecialtyResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() displayName!: string;
}
export class OwnerIdentityResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ['active', 'inactive'] }) status!: string;
  @ApiProperty({ type: [String] }) roles!: string[];
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}
export class OwnerSettingsResponseDto {
  @ApiProperty({ type: OwnerIdentityResponseDto, nullable: true })
  identity!: OwnerIdentityResponseDto | null;
  @ApiProperty() apiVersion!: string;
  @ApiProperty() environment!: string;
}
