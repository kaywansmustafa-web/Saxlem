import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from '../../doctors/presentation/doctor.dto';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import {
  EarlierTimeService,
  type EarlierStatus,
} from '../application/earlier-time.service';
import type { AppointmentAccess } from '../domain/appointment';
import { AppointmentParamsDto } from './appointment.dto';

class EarlierOfferDto {
  @ApiProperty({ format: 'date-time' }) startsAt!: string;
  @ApiProperty({ format: 'date-time' }) endsAt!: string;
  @ApiProperty({ type: 'integer' }) durationMinutes!: number;
}
class EarlierStatusDto {
  @ApiProperty() watching!: boolean;
  @ApiProperty({
    type: EarlierOfferDto,
    nullable: true,
    description: 'The latest earlier time found. It may have been taken since.',
  })
  offer!: EarlierOfferDto | null;
}

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireCapabilities('appointment:reschedule')
@Controller('appointments/:id/earlier')
export class EarlierTimeController {
  constructor(private readonly earlier: EarlierTimeService) {}

  @Get()
  @ApiOperation({ summary: 'Am I watching for an earlier time? (patients)' })
  @ApiOkResponse({ type: EarlierStatusDto })
  status(
    @Req() req: AuthenticatedRequest,
    @Param() p: AppointmentParamsDto,
  ): Promise<EarlierStatus> {
    return this.earlier.status(this.access(req), p.id);
  }

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Tell me if an earlier time opens (patients)',
    description:
      'For a visit at least 3 hours away. Offers come as notifications, at most every 6 hours; moving is up to the patient.',
  })
  @ApiOkResponse({ type: EarlierStatusDto })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  watch(
    @Req() req: AuthenticatedRequest,
    @Param() p: AppointmentParamsDto,
  ): Promise<EarlierStatus> {
    return this.earlier.watch(this.access(req), p.id);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Stop watching for an earlier time (patients)' })
  @ApiNoContentResponse()
  async stop(
    @Req() req: AuthenticatedRequest,
    @Param() p: AppointmentParamsDto,
  ): Promise<void> {
    await this.earlier.stop(this.access(req), p.id);
  }

  private access(req: AuthenticatedRequest): AppointmentAccess {
    if (!req.principal)
      throw new Error('Authentication guard invariant is broken.');
    return {
      actorId: req.principal.id,
      patient: req.principal.kind === 'patient',
      doctor: req.principal.capabilities.has('doctor:workspace:read'),
      platformAdministrator: req.principal.kind === 'platformAdministrator',
      organizationId: req.tenant?.organizationId,
      clinicId: req.tenant?.clinicId,
      doctorIds: req.tenant?.doctorIds,
    };
  }
}
