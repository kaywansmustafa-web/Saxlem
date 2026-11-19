import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  CATALOG_ICONS,
  CONCERN_LABEL_MAX,
  CONCERN_TONES,
  SPECIALTY_NAME_MAX,
  type CatalogIcon,
  type ConcernTone,
} from './catalog-rules';

// ---- Public: GET /app/config ----

export class LocalizedTextDto {
  @ApiProperty() en!: string;
  @ApiProperty() ar!: string;
  @ApiProperty() ku!: string;
}

export class AppSpecialtyDto {
  @ApiProperty({ example: 'cardiology' }) code!: string;
  @ApiProperty({ type: LocalizedTextDto }) names!: LocalizedTextDto;
  @ApiProperty({ enum: CATALOG_ICONS }) icon!: string;
  @ApiProperty() showOnHome!: boolean;
}

export class AppConcernDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: LocalizedTextDto }) labels!: LocalizedTextDto;
  @ApiProperty({ enum: CATALOG_ICONS }) icon!: string;
  @ApiProperty({ enum: CONCERN_TONES }) tone!: string;
  @ApiProperty({ type: [String] }) specialtyCodes!: string[];
}

export class AppConfigResponseDto {
  @ApiProperty({ type: [AppSpecialtyDto] }) specialties!: AppSpecialtyDto[];
  @ApiProperty({ type: [AppConcernDto] }) concerns!: AppConcernDto[];
  @ApiProperty({
    description: 'Public settings by key (Owner Portal → App settings).',
    type: 'object',
    additionalProperties: {
      oneOf: [{ type: 'boolean' }, { type: 'number' }, { type: 'string' }],
    },
  })
  settings!: Record<string, boolean | number | string>;
}

// ---- Owner Portal ----

export class CreateSpecialtyDto {
  @ApiProperty({ example: 'Cardiology' })
  @IsString()
  @MinLength(2)
  @MaxLength(SPECIALTY_NAME_MAX)
  nameEn!: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(SPECIALTY_NAME_MAX)
  nameAr?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(SPECIALTY_NAME_MAX)
  nameKu?: string | null;
  @ApiPropertyOptional({ enum: CATALOG_ICONS })
  @IsOptional()
  @IsIn(CATALOG_ICONS)
  icon?: CatalogIcon;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showOnHome?: boolean;
}

export class UpdateSpecialtyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(SPECIALTY_NAME_MAX)
  nameEn?: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  @MaxLength(SPECIALTY_NAME_MAX)
  nameAr?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  @MaxLength(SPECIALTY_NAME_MAX)
  nameKu?: string | null;
  @ApiPropertyOptional({ enum: CATALOG_ICONS })
  @IsOptional()
  @IsIn(CATALOG_ICONS)
  icon?: CatalogIcon;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showOnHome?: boolean;
  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}

export class ReorderDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  ids!: string[];
}

export class CreateConcernDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(CONCERN_LABEL_MAX)
  labelEn!: string;
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(CONCERN_LABEL_MAX)
  labelAr!: string;
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(CONCERN_LABEL_MAX)
  labelKu!: string;
  @ApiProperty({ enum: CATALOG_ICONS }) @IsIn(CATALOG_ICONS) icon!: CatalogIcon;
  @ApiProperty({ enum: CONCERN_TONES }) @IsIn(CONCERN_TONES) tone!: ConcernTone;
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  specialtyIds!: string[];
}

export class UpdateConcernDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(CONCERN_LABEL_MAX)
  labelEn?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(CONCERN_LABEL_MAX)
  labelAr?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(CONCERN_LABEL_MAX)
  labelKu?: string;
  @ApiPropertyOptional({ enum: CATALOG_ICONS })
  @IsOptional()
  @IsIn(CATALOG_ICONS)
  icon?: CatalogIcon;
  @ApiPropertyOptional({ enum: CONCERN_TONES })
  @IsOptional()
  @IsIn(CONCERN_TONES)
  tone?: ConcernTone;
  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  specialtyIds?: string[];
}

export class DoctorSpecialtiesDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsUUID('all', { each: true })
  specialtyIds!: string[];
  @ApiProperty({ format: 'uuid' }) @IsUUID() primarySpecialtyId!: string;
}

export class UpdateSettingsDto {
  @ApiProperty({
    description: 'Setting key → new value.',
    type: 'object',
    additionalProperties: {
      oneOf: [{ type: 'boolean' }, { type: 'number' }, { type: 'string' }],
    },
  })
  @IsObject()
  changes!: Record<string, unknown>;
}

export class IdParamsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() id!: string;
}
