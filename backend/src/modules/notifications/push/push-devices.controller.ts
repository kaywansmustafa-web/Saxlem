import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsString, Length } from 'class-validator';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import { PUSH_LOCALES, type PushLocale } from './push-copy';
import { PushDevicesService } from './push-devices.service';

class PushTokenDto {
  @ApiProperty({
    description:
      'Where Firebase Cloud Messaging reaches this app install: its Firebase Installation ID.',
  })
  @IsString()
  @Length(20, 4096)
  token!: string;
}

class RegisterPushDeviceDto extends PushTokenDto {
  @ApiProperty({ enum: ['android', 'ios'] })
  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';
  @ApiProperty({
    enum: PUSH_LOCALES,
    description: 'The app language; pushes are written in it.',
  })
  @IsIn(PUSH_LOCALES)
  locale!: PushLocale;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireCapabilities('patient:self')
@Controller('patients/me/push-devices')
export class PushDevicesController {
  constructor(private readonly devices: PushDevicesService) {}

  @Post()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Receive push notifications on this phone',
    description:
      'Called at sign-in, on app start and when the language or token changes.',
  })
  @ApiNoContentResponse()
  async register(
    @Req() req: AuthenticatedRequest,
    @Body() body: RegisterPushDeviceDto,
  ): Promise<void> {
    const principal = this.principal(req);
    await this.devices.register(principal.id, principal.sessionId, body);
  }

  @Post('remove')
  @HttpCode(204)
  @ApiOperation({ summary: 'Stop push notifications on this phone' })
  @ApiNoContentResponse()
  async remove(
    @Req() req: AuthenticatedRequest,
    @Body() body: PushTokenDto,
  ): Promise<void> {
    await this.devices.unregister(this.principal(req).id, body.token);
  }

  private principal(req: AuthenticatedRequest) {
    if (!req.principal)
      throw new Error('Authentication guard invariant is broken.');
    return req.principal;
  }
}
