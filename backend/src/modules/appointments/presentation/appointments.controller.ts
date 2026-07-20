import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
  AppointmentResponseDto,
  CancelAppointmentDto,
  CreateAppointmentDto,
  RescheduleAppointmentDto,
  UpdateAppointmentDto,
} from './appointment.dto';
@ApiTags('appointments')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly service: AppointmentService,
    private readonly mapper: AppointmentDtoMapper,
  ) {}
  @Get()
  @RequireCapabilities('appointment:read')
  @ApiOkResponse({ type: AppointmentResponseDto, isArray: true })
  @ApiServiceUnavailableResponse({
    description: 'Mandatory staff read audit is unavailable.',
  })
  async list(@Req() req: AuthenticatedRequest) {
    return (await this.service.list(this.access(req), req.requestId)).map((x) =>
      this.mapper.map(x),
    );
  }
  @Get(':id')
  @RequireCapabilities('appointment:read')
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiNotFoundResponse()
  @ApiServiceUnavailableResponse({
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
  @ApiConflictResponse({ description: 'Doctor or patient overlap.' })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateAppointmentDto,
  ) {
    return this.mapper.map(
      await this.service.create(
        this.access(req),
        { ...body, startsAt: new Date(body.startsAt) },
        req.requestId,
      ),
    );
  }
  @Patch(':id')
  @RequireCapabilities('appointment:update')
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiConflictResponse({
    description: 'Optimistic-concurrency version mismatch.',
  })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param() p: AppointmentParamsDto,
    @Body() body: UpdateAppointmentDto,
  ) {
    return this.mapper.map(
      await this.service.update(
        this.access(req),
        p.id,
        body.reason,
        body.version,
        req.requestId,
      ),
    );
  }
  @Post(':id/cancel')
  @RequireCapabilities('appointment:cancel')
  @ApiOkResponse({ type: AppointmentResponseDto })
  async cancel(
    @Req() req: AuthenticatedRequest,
    @Param() p: AppointmentParamsDto,
    @Body() body: CancelAppointmentDto,
  ) {
    return this.mapper.map(
      await this.service.cancel(
        this.access(req),
        p.id,
        body.reason,
        body.version,
        req.requestId,
      ),
    );
  }
  @Post(':id/reschedule')
  @RequireCapabilities('appointment:reschedule')
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiConflictResponse({
    description: 'Doctor/patient overlap or stale version.',
  })
  async reschedule(
    @Req() req: AuthenticatedRequest,
    @Param() p: AppointmentParamsDto,
    @Body() body: RescheduleAppointmentDto,
  ) {
    return this.mapper.map(
      await this.service.reschedule(
        this.access(req),
        p.id,
        new Date(body.startsAt),
        body.durationMinutes,
        body.version,
        req.requestId,
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
