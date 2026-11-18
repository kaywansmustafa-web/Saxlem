import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
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
import {
  DepartureService,
  PARK_AND_WALK_MINUTES,
} from '../application/departure.service';
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
import { DepartureRequestDto, DepartureResponseDto } from './departure.dto';
import { DayBoardQueryDto, DayBoardResponseDto } from './day-board.dto';
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
    private readonly departures: DepartureService,
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
  @Get('board')
  @RequireCapabilities('appointment:slots:read')
  @ApiOperation({
    summary: "Reception's day board for the signed-in clinic",
    description:
      'Every active doctor at the clinic with each slot of the day marked free, booked (with origin: app, phone or walk-in), unavailable (break, leave, holiday) or past. Built from the same schedule and conflict rules as booking.',
  })
  @ApiOkResponse({ type: DayBoardResponseDto })
  @ApiServiceUnavailableResponse({
    type: ApiErrorEnvelopeDto,
    description: 'Mandatory staff read audit is unavailable.',
  })
  board(@Req() req: AuthenticatedRequest, @Query() query: DayBoardQueryDto) {
    return this.service.dayBoard(this.access(req), query.date, req.requestId);
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
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    schema: {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      pattern: '^[\\x21-\\x7e]+$',
    },
  })
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
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    schema: {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      pattern: '^[\\x21-\\x7e]+$',
    },
  })
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
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    schema: {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      pattern: '^[\\x21-\\x7e]+$',
    },
  })
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
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    schema: {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      pattern: '^[\\x21-\\x7e]+$',
    },
  })
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
  @Post(':id/departure')
  @HttpCode(200)
  @RequireCapabilities('appointment:read')
  @ApiOperation({
    summary: 'When should I leave? (patients)',
    description:
      "Drive time from the patient's position to the clinic, with traffic when available. The position is used only for this answer: never stored or logged.",
  })
  @ApiOkResponse({ type: DepartureResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  async departure(
    @Req() req: AuthenticatedRequest,
    @Param() p: AppointmentParamsDto,
    @Body() body: DepartureRequestDto,
  ): Promise<DepartureResponseDto> {
    const plan = await this.departures.plan(this.access(req), p.id, body);
    return {
      leaveAt: plan.leaveAt.toISOString(),
      arriveBy: plan.arriveBy.toISOString(),
      travelSeconds: plan.travelSeconds,
      distanceMeters: plan.distanceMeters,
      source: plan.source,
      parkAndWalkMinutes: PARK_AND_WALK_MINUTES,
      computedAt: plan.computedAt.toISOString(),
    };
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
