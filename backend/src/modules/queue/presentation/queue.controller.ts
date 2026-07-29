import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from '../../doctors/presentation/doctor.dto';
import { QueueService } from '../application/queue.service';
import type { QueueAccess } from '../domain/queue';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import {
  EnqueueDto,
  EntryCommandDto,
  PatientQueueStatusResponseDto,
  PauseQueueDto,
  QueueAppointmentParamsDto,
  QueueCurrentParamsDto,
  QueueEntryParamsDto,
  QueueEntriesPageResponseDto,
  QueueEntriesQueryDto,
  QueueIdParamsDto,
  QueueResponseDto,
  QueueVersionDto,
} from './queue.dto';
import {
  mapPatientQueue,
  mapQueueEntries,
  mapStaffQueue,
} from './queue-dto.mapper';

const idempotencyHeader = {
  name: 'Idempotency-Key',
  required: true,
  schema: { type: 'string', minLength: 8, maxLength: 128 },
  description:
    '8–128 printable ASCII characters. Conflicting reuse returns 409.',
} as const;

@ApiTags('live-queue')
@ApiBearerAuth()
@ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
@ApiForbiddenResponse({ type: ApiErrorEnvelopeDto })
@ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
@ApiConflictResponse({ type: ApiErrorEnvelopeDto })
@ApiTooManyRequestsResponse({ type: ApiErrorEnvelopeDto })
@ApiServiceUnavailableResponse({ type: ApiErrorEnvelopeDto })
@ApiInternalServerErrorResponse({ type: ApiErrorEnvelopeDto })
@UseGuards(JwtAuthGuard)
@Controller()
export class QueueController {
  constructor(private readonly service: QueueService) {}

  @Get('queue-sessions/:id')
  @RequireCapabilities('queue:read')
  @ApiOkResponse({ type: QueueResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  get(@Req() req: AuthenticatedRequest, @Param() params: QueueIdParamsDto) {
    return this.service.get(this.access(req), params.id).then(mapStaffQueue);
  }

  @Get('queue-sessions/:id/entries')
  @RequireCapabilities('queue:read')
  @ApiOperation({ summary: 'Read the bounded authoritative staff queue' })
  @ApiOkResponse({ type: QueueEntriesPageResponseDto })
  entries(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueIdParamsDto,
    @Query() query: QueueEntriesQueryDto,
  ) {
    return this.service
      .entries(
        this.access(req),
        params.id,
        query.pageSize,
        query.cursor,
        query.includeTerminal,
      )
      .then(mapQueueEntries);
  }

  @Get('appointments/:appointmentId/queue-status')
  @RequireCapabilities('queue:patient-status:read')
  @ApiOperation({
    summary: 'Read only the authenticated patient’s queue position',
    description:
      'Never exposes another patient identity. Wait estimates are ranges and are suspended while paused.',
  })
  @ApiOkResponse({ type: PatientQueueStatusResponseDto })
  patientStatus(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueAppointmentParamsDto,
  ) {
    return this.service
      .patientStatus(this.access(req), params.appointmentId)
      .then(mapPatientQueue);
  }

  @Get('clinics/:clinicId/doctors/:doctorId/queue-session/current')
  @RequireCapabilities('queue:read')
  @ApiOkResponse({ type: QueueResponseDto })
  current(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueCurrentParamsDto,
  ) {
    return this.service
      .current(this.access(req), params.clinicId, params.doctorId)
      .then(mapStaffQueue);
  }

  @Post('clinics/:clinicId/doctors/:doctorId/queue-sessions/open')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(idempotencyHeader)
  @RequireCapabilities('queue:open')
  @ApiOkResponse({ type: QueueResponseDto })
  open(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueCurrentParamsDto,
    @Body() body: QueueVersionDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.service
      .open(
        this.access(req),
        params.clinicId,
        params.doctorId,
        body.version,
        key,
        req.requestId,
      )
      .then(mapStaffQueue);
  }

  @Post('queue-sessions/:id/enqueue')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(idempotencyHeader)
  @RequireCapabilities('queue:enqueue')
  @ApiOkResponse({ type: QueueResponseDto })
  enqueue(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueIdParamsDto,
    @Body() body: EnqueueDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.service
      .enqueue(
        this.access(req),
        params.id,
        body.appointmentId,
        body.version,
        key,
        req.requestId,
      )
      .then(mapStaffQueue);
  }

  @Post('queue-sessions/:id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(idempotencyHeader)
  @ApiOkResponse({ type: QueueResponseDto })
  @RequireCapabilities('queue:pause')
  pause(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueIdParamsDto,
    @Body() body: PauseQueueDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.service
      .sessionCommand(
        this.access(req),
        params.id,
        'pause',
        body.version,
        body.reason ?? null,
        key,
        req.requestId,
      )
      .then(mapStaffQueue);
  }
  @Post('queue-sessions/:id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(idempotencyHeader)
  @ApiOkResponse({ type: QueueResponseDto })
  @RequireCapabilities('queue:resume')
  resume(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueIdParamsDto,
    @Body() body: QueueVersionDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.service
      .sessionCommand(
        this.access(req),
        params.id,
        'resume',
        body.version,
        null,
        key,
        req.requestId,
      )
      .then(mapStaffQueue);
  }
  @Post('queue-sessions/:id/close')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(idempotencyHeader)
  @ApiOkResponse({ type: QueueResponseDto })
  @RequireCapabilities('queue:close')
  close(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueIdParamsDto,
    @Body() body: QueueVersionDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.service
      .sessionCommand(
        this.access(req),
        params.id,
        'close',
        body.version,
        null,
        key,
        req.requestId,
      )
      .then(mapStaffQueue);
  }
  @Post('queue-sessions/:id/call-next')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(idempotencyHeader)
  @ApiOkResponse({ type: QueueResponseDto })
  @RequireCapabilities('queue:call-next')
  callNext(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueIdParamsDto,
    @Body() body: QueueVersionDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.service
      .callNext(this.access(req), params.id, body.version, key, req.requestId)
      .then(mapStaffQueue);
  }

  @Post('queue-sessions/:id/entries/:entryId/recall')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(idempotencyHeader)
  @ApiOkResponse({ type: QueueResponseDto })
  @RequireCapabilities('queue:recall')
  recall(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueEntryParamsDto,
    @Body() body: EntryCommandDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.entry(req, params, body, key, 'recall');
  }
  @Post('queue-sessions/:id/entries/:entryId/no-response')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(idempotencyHeader)
  @ApiOkResponse({ type: QueueResponseDto })
  @RequireCapabilities('queue:mark-no-response')
  noResponse(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueEntryParamsDto,
    @Body() body: EntryCommandDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.entry(req, params, body, key, 'no-response');
  }
  @Post('queue-sessions/:id/entries/:entryId/start-consultation')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(idempotencyHeader)
  @ApiOkResponse({ type: QueueResponseDto })
  @RequireCapabilities('queue:consultation:start')
  start(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueEntryParamsDto,
    @Body() body: EntryCommandDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.entry(req, params, body, key, 'start');
  }
  @Post('queue-sessions/:id/entries/:entryId/complete-consultation')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(idempotencyHeader)
  @ApiOkResponse({ type: QueueResponseDto })
  @RequireCapabilities('queue:consultation:complete')
  complete(
    @Req() req: AuthenticatedRequest,
    @Param() params: QueueEntryParamsDto,
    @Body() body: EntryCommandDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.entry(req, params, body, key, 'complete');
  }

  private entry(
    req: AuthenticatedRequest,
    params: QueueEntryParamsDto,
    body: EntryCommandDto,
    key: string,
    operation: 'recall' | 'no-response' | 'start' | 'complete',
  ) {
    return this.service
      .entryCommand(
        this.access(req),
        params.id,
        params.entryId,
        operation,
        body.sessionVersion,
        body.entryVersion,
        key,
        req.requestId,
      )
      .then(mapStaffQueue);
  }

  private access(req: AuthenticatedRequest): QueueAccess {
    if (!req.principal)
      throw new Error('Authentication guard invariant is broken.');
    return {
      actorId: req.principal.id,
      patient: req.principal.kind === 'patient',
      doctor: req.principal.capabilities.has('doctor:workspace:read'),
      platformAdministrator: req.principal.kind === 'platformAdministrator',
      organizationId: req.tenant?.organizationId,
      clinicId: req.tenant?.clinicId,
      capabilities: req.principal.capabilities,
    };
  }
}
