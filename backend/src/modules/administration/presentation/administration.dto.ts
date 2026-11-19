import { Transform, Type, type TransformFnParams } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
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

export class CreateOrganizationDto {
  @ApiProperty({ minLength: 1, maxLength: 120, example: 'Saxlem Health Group' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(/^[\p{L}\p{M}\p{N}\p{P}\p{Zs}]+$/u)
  name!: string;
}

export class CreateClinicDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
  @ApiProperty({ minLength: 1, maxLength: 120 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(/^[\p{L}\p{M}\p{N}\p{P}\p{Zs}]+$/u)
  name!: string;
  @ApiProperty({
    minLength: 2,
    maxLength: 32,
    pattern: '^[A-Za-z0-9][A-Za-z0-9_-]*$',
  })
  @Transform(upper)
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9_-]*$/)
  code!: string;
  @ApiProperty({ example: 'Asia/Baghdad', maxLength: 100 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+-]+)+$/)
  timezone!: string;
}

export class AdministrationListQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 25;
  @ApiPropertyOptional({
    type: String,
    maxLength: 2048,
    description: 'Opaque signed cursor.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  cursor?: string;
}

export class ClinicListQueryDto extends AdministrationListQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

export class OrganizationParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
}

export class ClinicParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() clinicId!: string;
}

export class OrganizationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ['active', 'inactive'] }) status!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class UpdateClinicLocationDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 300 })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(300)
  address?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 120 })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(120)
  area?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 80 })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(80)
  city?: string | null;
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '+9647501234567',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(24)
  phoneNumber?: string | null;
}

export class ClinicResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() code!: string;
  @ApiProperty() timezone!: string;
  @ApiProperty({ enum: ['active', 'inactive'] }) status!: string;
  @ApiProperty({ type: String, nullable: true }) address!: string | null;
  @ApiProperty({ type: String, nullable: true }) area!: string | null;
  @ApiProperty({ type: String, nullable: true }) city!: string | null;
  @ApiProperty({ type: Number, nullable: true }) latitude!: number | null;
  @ApiProperty({ type: Number, nullable: true }) longitude!: number | null;
  @ApiProperty({ type: String, nullable: true }) phoneNumber!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class OrganizationPageResponseDto {
  @ApiProperty({ type: OrganizationResponseDto, isArray: true })
  items!: OrganizationResponseDto[];
  @ApiProperty({ type: String, nullable: true }) nextCursor!: string | null;
}

export class ClinicPageResponseDto {
  @ApiProperty({ type: ClinicResponseDto, isArray: true })
  items!: ClinicResponseDto[];
  @ApiProperty({ type: String, nullable: true }) nextCursor!: string | null;
}

function trim({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function upper({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}
