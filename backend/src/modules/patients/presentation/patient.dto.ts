import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
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
  @ApiProperty() relationship!: string;
  @ApiProperty() active!: boolean;
  @ApiProperty() version!: number;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
