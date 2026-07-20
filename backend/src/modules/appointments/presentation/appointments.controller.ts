import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiHeader,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from '../../doctors/presentation/doctor.dto';
import { AppointmentService } from '../application/appointment.service';
import type { AppointmentAccess } from '../domain/appointment';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import { AppointmentDtoMapper } from './appointment-dto.mapper';
import {
  AppointmentParamsDto,
  AppointmentListQueryDto,
  AppointmentPageResponseDto,
  AppointmentResponseDto,
  CancelAppointmentDto,
  CreateAppointmentDto,
  RescheduleAppointmentDto,
  UpdateAppointmentDto,
} from './appointment.dto';
@ApiTags('appointments')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
@ApiForbiddenResponse({ type: ApiErrorEnvelopeDto })
@ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly service: AppointmentService,
    private readonly mapper: AppointmentDtoMapper,
  ) {}
  @Get()
  @RequireCapabilities('appointment:read')
  @ApiOkResponse({ type: AppointmentPageResponseDto })
  @ApiServiceUnavailableResponse({
    type: ApiErrorEnvelopeDto,
    description: 'Mandatory staff read audit is unavailable.',
  })
  async list(
    @Req() req: AuthenticatedRequest,
    @Query() query: AppointmentListQueryDto,
  ) {
    const page = await this.service.list(
      this.access(req),
      { ...query, from: new Date(query.from), to: new Date(query.to) },
      req.requestId,
    );
    return {
      items: page.items.map((x) => this.mapper.map(x)),
      nextCursor: page.nextCursor,
    };
  }
  @Get(':id')
  @RequireCapabilities('appointment:read')
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiServiceUnavailableResponse({
    type: ApiErrorEnvelopeDto,
    description: 'Mandatory staff read audit is unavailable.',
  })
  async get(
    @Req() req: AuthenticatedRequest,
    @Param() p: AppointmentParamsDto,
  ) {
    return this.mapper.map(
      await this.service.get(this.access(req), p.id, req.requestId),
    );
  }
  @Post()
  @RequireCapabilities('appointment:create')
  @ApiOperation({
    summary: 'Create a validated appointment',
    description:
      'Validates active tenant participants, effective doctor schedule, leave, holidays, exceptions, and doctor/patient overlaps. No queue or notification behavior occurs.',
  })
  @ApiCreatedResponse({ type: AppointmentResponseDto })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiConflictResponse({
    type: ApiErrorEnvelopeDto,
    description: 'Doctor/patient overlap or idempotency conflict.',
  })
  @ApiServiceUnavailableResponse({
    type: ApiErrorEnvelopeDto,
    description: 'Mandatory command audit is unavailable.',
  })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateAppointmentDto,
    @Headers('idempotency-key') idempotencyKey = '',
  ) {
    return this.mapper.map(
      await this.service.create(
        this.access(req),
        {
          ...body,
          startsAt: new Date(body.startsAt),
          startsAtSource: body.startsAt,
        },
        idempotencyKey,
        req.requestId,
      ),
    );
  }
  @Patch(':id')
  @RequireCapabilities('appointment:update')
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiConflictResponse({
    type: ApiErrorEnvelopeDto,
    description:
      'Optimistic-concurrency version mismatch or idempotency conflict.',
  })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiServiceUnavailableResponse({ type: ApiErrorEnvelopeDto })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param() p: AppointmentParamsDto,
    @Body() body: UpdateAppointmentDto,
    @Headers('idempotency-key') idempotencyKey = '',
  ) {
    return this.mapper.map(
      await this.service.update(
        this.access(req),
        p.id,
        body.reason,
        body.version,
        idempotencyKey,
        req.requestId,
      ),
    );
  }
  @Post(':id/cancel')
  @RequireCapabilities('appointment:cancel')
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiConflictResponse({
    type: ApiErrorEnvelopeDto,
    description: 'Stale version or idempotency conflict.',
  })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiServiceUnavailableResponse({ type: ApiErrorEnvelopeDto })
  async cancel(
    @Req() req: AuthenticatedRequest,
    @Param() p: AppointmentParamsDto,
    @Body() body: CancelAppointmentDto,
    @Headers('idempotency-key') idempotencyKey = '',
  ) {
    return this.mapper.map(
      await this.service.cancel(
        this.access(req),
        p.id,
        body.reason,
        body.version,
        idempotencyKey,
        req.requestId,
      ),
    );
  }
  @Post(':id/reschedule')
  @RequireCapabilities('appointment:reschedule')
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiConflictResponse({
    type: ApiErrorEnvelopeDto,
    description: 'Doctor/patient overlap or stale version.',
  })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiServiceUnavailableResponse({ type: ApiErrorEnvelopeDto })
  async reschedule(
    @Req() req: AuthenticatedRequest,
    @Param() p: AppointmentParamsDto,
    @Body() body: RescheduleAppointmentDto,
    @Headers('idempotency-key') idempotencyKey = '',
  ) {
    return this.mapper.map(
      await this.service.reschedule(
        this.access(req),
        p.id,
        new Date(body.startsAt),
        body.durationMinutes,
        body.version,
        idempotencyKey,
        req.requestId,
        body.startsAt,
      ),
    );
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
    };
  }
}
