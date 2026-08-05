import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
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
import { doctorLanguages, maximumDoctorSearchPage } from '../domain/doctor';

export class DoctorParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() id!: string;
}

export class DoctorDiscoveryOptionsQueryDto {}

export class DoctorSearchDto {
  @ApiPropertyOptional({ example: 'cardiology' })
  @IsOptional()
  @Matches(/^[a-z][a-z0-9-]{1,63}$/)
  specialty?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;
  @ApiPropertyOptional({ enum: doctorLanguages })
  @IsOptional()
  @IsIn(doctorLanguages)
  language?: string;
  @ApiPropertyOptional({ enum: ['female', 'male', 'unspecified'] })
  @IsOptional()
  @IsIn(['female', 'male', 'unspecified'])
  gender?: 'female' | 'male' | 'unspecified';
  @ApiPropertyOptional({ enum: ['active', 'inactive'], default: 'active' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
  @ApiPropertyOptional({ type: 'integer', minimum: 0, maximum: 80 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(80)
  minimumYearsOfExperience?: number;
  @ApiPropertyOptional({ example: 'ژیان', minLength: 1, maxLength: 120 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;
  @ApiPropertyOptional({
    type: 'integer',
    default: 1,
    minimum: 1,
    maximum: maximumDoctorSearchPage,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(maximumDoctorSearchPage)
  page = 1;
  @ApiPropertyOptional({
    type: 'integer',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}

export class SpecialtyResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'cardiology' }) code!: string;
  @ApiProperty({ example: 'Cardiology' }) displayName!: string;
  @ApiProperty() isPrimary!: boolean;
}

export class DoctorAvailabilityResponseDto {
  @ApiProperty({ enum: ['available', 'unavailable'] }) status!: string;
  @ApiProperty() acceptingNewPatients!: boolean;
  @ApiProperty({ nullable: true, format: 'date-time' }) nextAvailableAt!:
    string | null;
  @ApiProperty({ nullable: true, format: 'date-time' }) updatedAt!:
    string | null;
}

export class DoctorClinicResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Saxlem Medical Center' }) name!: string;
}

export class DoctorDiscoverySpecialtyOptionResponseDto {
  @ApiProperty({ example: 'cardiology' }) code!: string;
  @ApiProperty({ example: 'Cardiology' }) displayName!: string;
}

export class DoctorDiscoveryClinicOptionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Saxlem Medical Center' }) name!: string;
}

export class DoctorDiscoveryExperienceOptionResponseDto {
  @ApiProperty({ type: 'integer', nullable: true, minimum: 0 })
  minimum!: number | null;
  @ApiProperty({ type: 'integer', nullable: true, minimum: 0 })
  maximum!: number | null;
}

export class DoctorDiscoveryOptionsResponseDto {
  @ApiProperty({
    type: DoctorDiscoverySpecialtyOptionResponseDto,
    isArray: true,
  })
  specialties!: DoctorDiscoverySpecialtyOptionResponseDto[];
  @ApiProperty({
    type: DoctorDiscoveryClinicOptionResponseDto,
    isArray: true,
  })
  clinics!: DoctorDiscoveryClinicOptionResponseDto[];
  @ApiProperty({ enum: doctorLanguages, isArray: true })
  languages!: string[];
  @ApiProperty({
    enum: ['female', 'male', 'unspecified'],
    isArray: true,
  })
  genders!: string[];
  @ApiProperty({ type: DoctorDiscoveryExperienceOptionResponseDto })
  experience!: DoctorDiscoveryExperienceOptionResponseDto;
}

export class ApiFieldErrorDto {
  @ApiProperty() field!: string;
  @ApiProperty() code!: string;
  @ApiProperty() message!: string;
}

export class ApiErrorBodyDto {
  @ApiProperty() code!: string;
  @ApiProperty() message!: string;
  @ApiProperty() requestId!: string;
  @ApiProperty() retryable!: boolean;
  @ApiProperty({ type: ApiFieldErrorDto, isArray: true })
  fieldErrors!: ApiFieldErrorDto[];
}

export class ApiErrorEnvelopeDto {
  @ApiProperty({ type: ApiErrorBodyDto }) error!: ApiErrorBodyDto;
}

export class DoctorListItemResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Dr. Shilan Ahmed' }) displayName!: string;
  @ApiProperty({
    example: 'Dr. Shilan Ahmed',
    description: 'Flutter-compatible alias.',
  })
  fullName!: string;
  @ApiProperty({
    example: 'Cardiology',
    description: 'Primary specialty display name.',
  })
  specialty!: string;
  @ApiProperty({ enum: ['female', 'male', 'unspecified'] }) gender!: string;
  @ApiProperty({ enum: ['active', 'inactive'] }) status!: string;
  @ApiProperty({ type: 'integer', example: 12, minimum: 0 })
  yearsOfExperience!: number;
  @ApiProperty({ enum: doctorLanguages, isArray: true }) languages!: string[];
  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Public image URL, or null until an approved publication boundary exists.',
  })
  profileImageUrl!: string | null;
  @ApiProperty({ type: DoctorClinicResponseDto, isArray: true })
  clinics!: DoctorClinicResponseDto[];
  @ApiProperty({ type: DoctorAvailabilityResponseDto })
  availability!: DoctorAvailabilityResponseDto;
}

export class DoctorDetailResponseDto extends DoctorListItemResponseDto {
  @ApiProperty({ example: 'Shilan' }) firstName!: string;
  @ApiProperty({ example: 'Ahmed' }) lastName!: string;
  @ApiProperty({ example: 'KRI-MED-12345' }) licenseNumber!: string;
  @ApiProperty({
    example: 'A licensed cardiologist with extensive clinical experience.',
  })
  biography!: string;
  @ApiProperty({ type: SpecialtyResponseDto, isArray: true })
  specialties!: SpecialtyResponseDto[];
}

export class DoctorProfessionalProfileResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() specialty!: string;
  @ApiProperty({ enum: ['female', 'male', 'unspecified'] }) gender!: string;
  @ApiProperty() licenseNumber!: string;
  @ApiProperty({ type: 'integer', minimum: 0 }) yearsOfExperience!: number;
  @ApiProperty() biography!: string;
  @ApiProperty({ enum: doctorLanguages, isArray: true }) languages!: string[];
  @ApiProperty({ type: String, nullable: true }) profileImageUrl!:
    string | null;
  @ApiProperty({ type: SpecialtyResponseDto, isArray: true })
  specialties!: SpecialtyResponseDto[];
}

export class DoctorPageResponseDto {
  @ApiProperty({ type: DoctorListItemResponseDto, isArray: true })
  items!: DoctorListItemResponseDto[];
  @ApiProperty({
    type: 'integer',
    example: 1,
    minimum: 1,
    maximum: maximumDoctorSearchPage,
  })
  page!: number;
  @ApiProperty({ type: 'integer', example: 20, minimum: 1, maximum: 100 })
  pageSize!: number;
  @ApiProperty({ type: 'integer', example: 42, minimum: 0 }) total!: number;
  @ApiProperty({ type: 'integer', example: 3, minimum: 0 })
  totalPages!: number;
}
