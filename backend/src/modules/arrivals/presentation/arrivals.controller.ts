import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from '../../doctors/presentation/doctor.dto';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import { ArrivalService } from '../application/arrival.service';
import type { ArrivalAccess } from '../domain/arrival';
import { ArrivalDtoMapper } from './arrival-dto.mapper';
import {
  ArrivalParamsDto,
  ArrivalResponseDto,
  RecordArrivalDto,
} from './arrival.dto';

@ApiTags('patient-arrival')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
@ApiForbiddenResponse({ type: ApiErrorEnvelopeDto })
@ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
@UseGuards(JwtAuthGuard)
@Controller('appointments/:id/arrival')
export class ArrivalsController {
  constructor(
    private readonly service: ArrivalService,
    private readonly mapper: ArrivalDtoMapper,
  ) {}

  @Get()
  @RequireCapabilities('arrival:read')
  @ApiOperation({
    summary: 'Read appointment arrival eligibility',
    description:
      'Patients may read only their appointments; doctors only their appointments; clinic staff are tenant-scoped; platform administrators may cross tenants. Staff reads require a durable arrival.viewed audit.',
  })
  @ApiOkResponse({ type: ArrivalResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiServiceUnavailableResponse({
    type: ApiErrorEnvelopeDto,
    description: 'Mandatory staff read audit is unavailable.',
  })
  async get(
    @Req() req: AuthenticatedRequest,
    @Param() params: ArrivalParamsDto,
  ) {
    return this.mapper.map(
      await this.service.get(this.access(req), params.id, req.requestId),
    );
  }

  @Post()
  @RequireCapabilities('arrival:record')
  @ApiOperation({
    summary: 'Record physical patient arrival',
    description:
      'Requires Idempotency-Key and the expected arrival version. The appointment must be active, owned and tenant-scoped, have active participants, and fall inside the configured early/late window. The state advances expected → arrived → queueReady. No queue row, number, ordering, call, consultation, notification, or realtime action occurs.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      '8-128 non-whitespace printable ASCII characters. Identical completed requests replay; reuse for different input conflicts.',
  })
  @ApiCreatedResponse({ type: ArrivalResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiConflictResponse({
    type: ApiErrorEnvelopeDto,
    description:
      'Duplicate arrival, stale version, invalid appointment lifecycle, outside arrival window, or idempotency conflict.',
  })
  @ApiServiceUnavailableResponse({
    type: ApiErrorEnvelopeDto,
    description: 'Mandatory command audit is unavailable.',
  })
  async record(
    @Req() req: AuthenticatedRequest,
    @Param() params: ArrivalParamsDto,
    @Body() body: RecordArrivalDto,
    @Headers('idempotency-key') idempotencyKey = '',
  ) {
    return this.mapper.map(
      await this.service.record(
        this.access(req),
        params.id,
        body.version,
        idempotencyKey,
        req.requestId,
      ),
    );
  }

  private access(req: AuthenticatedRequest): ArrivalAccess {
    if (!req.principal)
      throw new Error('Authentication guard invariant is broken.');
    return {
      actorId: req.principal.id,
      patient: req.principal.kind === 'patient',
      doctor: req.principal.capabilities.has('doctor:workspace:read'),
      platformAdministrator: req.principal.kind === 'platformAdministrator',
      organizationId: req.tenant?.organizationId,
      clinicId: req.tenant?.clinicId,
    };
  }
}
