import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewAppointmentParamsDto {
  @IsUUID('all') id!: string;
}
export class ReviewDoctorParamsDto {
  @IsUUID('all') id!: string;
}
export class ReviewIdParamsDto {
  @IsUUID('all') reviewId!: string;
}

export class WriteReviewDto {
  @ApiProperty({ type: 'integer', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
  @ApiPropertyOptional({
    maxLength: 2000,
    nullable: true,
    description: "Up to the owner's limit (App settings → Reviews).",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2100)
  comment?: string | null;
  @ApiProperty({ description: 'Show "Saxlem patient" instead of the name.' })
  @IsBoolean()
  anonymous!: boolean;
}

export class ReviewListQueryDto {
  @ApiPropertyOptional({ description: 'From nextCursor.' })
  @IsOptional()
  @IsString()
  // base64url of "<ISO time>|<uuid>": 82 characters.
  @MaxLength(120)
  cursor?: string;
  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

export class PlatformReviewQueryDto extends ReviewListQueryDto {
  @ApiPropertyOptional({ enum: ['published', 'hidden'] })
  @IsOptional()
  @IsIn(['published', 'hidden'])
  status?: 'published' | 'hidden';
}

export class SetReviewStatusDto {
  @ApiProperty({ enum: ['published', 'hidden'] })
  @IsIn(['published', 'hidden'])
  status!: 'published' | 'hidden';
}

export class MyReviewDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: 'integer' }) rating!: number;
  @ApiProperty({ type: String, nullable: true }) comment!: string | null;
  @ApiProperty() anonymous!: boolean;
  @ApiProperty({ enum: ['published', 'hidden'] }) status!:
    'published' | 'hidden';
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class AppointmentReviewResponseDto {
  @ApiProperty({ description: 'The visit took place and the window is open.' })
  canReview!: boolean;
  @ApiProperty({ format: 'date-time', type: String, nullable: true })
  reviewableUntil!: string | null;
  @ApiProperty({ type: MyReviewDto, nullable: true })
  review!: MyReviewDto | null;
}

export class PublicReviewDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: 'integer', minimum: 1, maximum: 5 }) rating!: number;
  @ApiProperty({ type: String, nullable: true }) comment!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: '"Avin K.", or null when the patient posted anonymously.',
  })
  author!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}

export class RatingSummaryDto {
  @ApiProperty({ description: 'One decimal; 0 when there are none.' })
  average!: number;
  @ApiProperty({ type: 'integer' }) count!: number;
  @ApiProperty({
    type: 'integer',
    isArray: true,
    description: 'How many 1, 2, 3, 4 and 5-star reviews.',
  })
  distribution!: number[];
}

export class DoctorReviewPageDto {
  @ApiProperty({ type: RatingSummaryDto }) summary!: RatingSummaryDto;
  @ApiProperty({ type: PublicReviewDto, isArray: true })
  items!: PublicReviewDto[];
  @ApiProperty({ type: String, nullable: true }) nextCursor!: string | null;
}

export class PlatformReviewDto extends PublicReviewDto {
  @ApiProperty({ enum: ['published', 'hidden'] }) status!:
    'published' | 'hidden';
  @ApiProperty({ description: 'Shown even when posted anonymously.' })
  authorName!: string;
  @ApiProperty() anonymous!: boolean;
  @ApiProperty({ format: 'uuid' }) doctorId!: string;
  @ApiProperty() doctorName!: string;
  @ApiProperty() clinicName!: string;
  @ApiProperty() appointmentReference!: string;
}

export class PlatformReviewPageDto {
  @ApiProperty({ type: PlatformReviewDto, isArray: true })
  items!: PlatformReviewDto[];
  @ApiProperty({ type: String, nullable: true }) nextCursor!: string | null;
}
