import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class PatientProfileParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() id!: string;
}

export class PatientProfileBodyDto {
  @ApiProperty({ example: 'Shilan' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}'’.-]*$/u)
  firstName!: string;
  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}'’.-]*$/u)
  lastName!: string;
  @ApiProperty({ example: '1995-04-21', format: 'date' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/)
  dateOfBirth!: string;
  @ApiProperty({ enum: ['female', 'male', 'unspecified'] })
  @IsIn(['female', 'male', 'unspecified'])
  gender!: 'female' | 'male' | 'unspecified';
}

export class CreatePatientProfileDto extends PatientProfileBodyDto {
  @ApiProperty({
    enum: [
      'me',
      'mother',
      'father',
      'son',
      'daughter',
      'brother',
      'sister',
      'grandfather',
      'grandmother',
      'wife',
      'husband',
      'other',
    ],
  })
  @IsIn([
    'me',
    'mother',
    'father',
    'son',
    'daughter',
    'brother',
    'sister',
    'grandfather',
    'grandmother',
    'wife',
    'husband',
    'other',
  ])
  relationship!: string;
}

export class UpdatePatientProfileDto extends PatientProfileBodyDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  version!: number;
}

export class ArchivePatientProfileDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  version!: number;
}

export class ActivatePatientProfileDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() profileId!: string;
}

export class PatientProfileResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty({ format: 'date' }) dateOfBirth!: string;
  @ApiProperty({ enum: ['female', 'male', 'unspecified'] }) gender!: string;
  @ApiProperty({
    enum: [
      'me',
      'mother',
      'father',
      'son',
      'daughter',
      'brother',
      'sister',
      'grandfather',
      'grandmother',
      'wife',
      'husband',
      'other',
    ],
  })
  relationship!: string;
  @ApiProperty({ type: Boolean }) active!: boolean;
  @ApiProperty({ type: 'integer', format: 'int32', minimum: 1 })
  version!: number;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
}

export class PatientAccountResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  activeProfileId!: string | null;
  @ApiProperty({ type: PatientProfileResponseDto, nullable: true })
  activeProfile!: PatientProfileResponseDto | null;
  @ApiProperty({ type: 'integer', format: 'int32', minimum: 0 })
  profileCount!: number;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
}

export class PatientDirectorySearchQueryDto {
  @ApiProperty({
    minLength: 2,
    maxLength: 100,
    description:
      'Trimmed search term for patient name, phone number, or profile identifier prefix.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q!: string;

  @ApiPropertyOptional({
    type: 'integer',
    format: 'int32',
    minimum: 1,
    maximum: 25,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(25)
  pageSize?: number = 10;

  @ApiPropertyOptional({
    type: String,
    maxLength: 2048,
    description: 'Opaque signed cursor.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  cursor?: string;
}

export class PatientDirectoryProfileParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() patientProfileId!: string;
}

export class PatientDirectoryListItemResponseDto {
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;
  @ApiProperty({ type: String }) displayName!: string;
  @ApiProperty({ type: Boolean }) active!: boolean;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastAppointmentAt!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  nextAppointmentAt!: string | null;
}

export class PatientDirectoryPageResponseDto {
  @ApiProperty({ type: PatientDirectoryListItemResponseDto, isArray: true })
  items!: PatientDirectoryListItemResponseDto[];
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Opaque signed cursor.',
  })
  nextCursor!: string | null;
}

export class PatientDirectoryAppointmentResponseDto {
  @ApiProperty({ format: 'uuid' }) appointmentId!: string;
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty({ type: String, nullable: true }) doctorName!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) scheduledStartAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) scheduledEndAt!: string;
  @ApiProperty({
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'noShow'],
  })
  status!: string;
  @ApiProperty({ type: 'integer', format: 'int32', minimum: 1 })
  version!: number;
}

export class PatientDirectoryAppointmentsResponseDto {
  @ApiProperty({ type: PatientDirectoryAppointmentResponseDto, isArray: true })
  upcoming!: PatientDirectoryAppointmentResponseDto[];

  @ApiProperty({ type: PatientDirectoryAppointmentResponseDto, isArray: true })
  recent!: PatientDirectoryAppointmentResponseDto[];
}

export class PatientDirectoryProfileDetailResponseDto {
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;
  @ApiProperty({ type: String }) displayName!: string;
  @ApiProperty({ type: Boolean }) active!: boolean;
  @ApiProperty({ type: PatientDirectoryAppointmentsResponseDto })
  appointments!: PatientDirectoryAppointmentsResponseDto;
}
