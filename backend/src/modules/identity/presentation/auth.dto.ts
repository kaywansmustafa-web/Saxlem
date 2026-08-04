import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OtpChallengeResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  challengeId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: string;

  @ApiPropertyOptional({
    type: String,
    minLength: 6,
    maxLength: 6,
    pattern: '^\\d{6}$',
    description: 'Present only in the development environment.',
  })
  developmentOtp?: string;
}

export class AuthenticationTokensResponseDto {
  @ApiProperty({
    type: String,
    description: 'Short-lived bearer access token.',
  })
  accessToken!: string;

  @ApiProperty({
    type: String,
    description: 'Opaque rotating refresh token.',
  })
  refreshToken!: string;

  @ApiProperty({
    type: 'integer',
    format: 'int32',
    minimum: 1,
    example: 600,
  })
  expiresInSeconds!: number;
}
