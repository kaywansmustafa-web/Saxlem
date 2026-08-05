import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiAcceptedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';
import { AuthenticationService } from '../application/authentication.service';
import {
  AuthenticationTokensResponseDto,
  OtpChallengeResponseDto,
} from './auth.dto';

class DeviceDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(128) deviceId!: string;
  @ApiProperty({ enum: ['android', 'ios', 'web', 'desktop'] })
  @IsIn(['android', 'ios', 'web', 'desktop'])
  platform!: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;
}
class RequestOtpDto {
  @ApiProperty({ example: '+9647500000000' })
  @Matches(/^\+9647\d{9}$/)
  phone!: string;
}
class VerifyOtpDto extends DeviceDto {
  @ApiProperty() @IsString() @MaxLength(64) challengeId!: string;
  @ApiProperty({ writeOnly: true })
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  otp!: string;
}
class LoginDto extends DeviceDto {
  @ApiProperty() @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty({ writeOnly: true })
  @MinLength(12)
  @MaxLength(256)
  password!: string;
}
class RefreshDto extends DeviceDto {
  @ApiProperty({ writeOnly: true })
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  refreshToken!: string;
}
class LogoutDto {
  @ApiProperty({ writeOnly: true })
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  refreshToken!: string;
}

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthenticationService) {}
  @Post('request-otp')
  @HttpCode(202)
  @ApiOperation({ summary: 'Request an Iraqi mobile OTP challenge' })
  @ApiAcceptedResponse({ type: OtpChallengeResponseDto })
  requestOtp(@Body() dto: RequestOtpDto, @Req() request: Request) {
    return this.auth.requestOtp(dto.phone, request.ip);
  }
  @Post('verify-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify OTP and create a patient session' })
  @ApiOkResponse({ type: AuthenticationTokensResponseDto })
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() request: Request) {
    return this.auth.verifyOtp(
      dto.challengeId,
      dto.otp,
      this.device(dto, request),
      request.ip,
    );
  }
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Authenticate clinic staff with email and password',
  })
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.auth.login(
      dto.email,
      dto.password,
      this.device(dto, request),
      request.ip,
    );
  }
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate an opaque refresh token' })
  @ApiOkResponse({ type: AuthenticationTokensResponseDto })
  refresh(@Body() dto: RefreshDto, @Req() request: Request) {
    return this.auth.refresh(
      dto.refreshToken,
      this.device(dto, request),
      request.ip,
    );
  }
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke one refresh session' })
  logout(@Body() dto: LogoutDto, @Req() request: Request) {
    return this.auth.logout(dto.refreshToken, request.ip);
  }
  @Post('logout-all')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke every session for the identity' })
  logoutAll(@Body() dto: LogoutDto, @Req() request: Request) {
    return this.auth.logoutAll(dto.refreshToken, request.ip);
  }

  private device(dto: DeviceDto, request: Request) {
    return {
      deviceId: dto.deviceId,
      platform: dto.platform,
      userAgent: dto.userAgent ?? request.get('user-agent') ?? 'unknown',
      ipAddress: request.ip ?? 'unknown',
    };
  }
}
