import {
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { NotificationService } from '../application/notification.service';
import type { NotificationAccess } from '../domain/notification';
import { NotificationStreamService } from '../application/notification-stream.service';
import {
  NotificationIdParamsDto,
  NotificationPageDto,
  NotificationQueryDto,
  NotificationReadResponseDto,
} from './notification.dto';
import {
  mapNotification,
  mapReadNotification,
} from './notification-dto.mapper';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import type { AuthenticatedRequest } from '../../identity/presentation/jwt-auth.guard';
import { JwtAuthGuard } from '../../identity/presentation/jwt-auth.guard';
import { ApiErrorEnvelopeDto } from '../../doctors/presentation/doctor.dto';

@ApiTags('Notifications')
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
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationService,
    private readonly stream: NotificationStreamService,
  ) {}

  @Get()
  @RequireCapabilities('notifications:read')
  @ApiOkResponse({ type: NotificationPageDto })
  async list(
    @Req() req: AuthenticatedRequest,
    @Query() query: NotificationQueryDto,
  ): Promise<NotificationPageDto> {
    const page = await this.service.list(
      this.access(req),
      query.cursor,
      query.pageSize,
      query.unreadOnly,
    );
    return {
      items: page.items.map(mapNotification),
      nextCursor: page.nextCursor,
    };
  }

  @Post(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  @RequireCapabilities('notifications:mark-read')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    schema: { type: 'string', minLength: 8, maxLength: 128 },
    description:
      '8–128 printable ASCII characters. Conflicting reuse returns 409.',
  })
  @ApiOkResponse({ type: NotificationReadResponseDto })
  async markRead(
    @Req() req: AuthenticatedRequest,
    @Param() params: NotificationIdParamsDto,
    @Headers('idempotency-key') key = '',
  ): Promise<NotificationReadResponseDto> {
    return this.service
      .markRead(this.access(req), params.notificationId, key, req.requestId)
      .then(mapReadNotification);
  }

  @Get('stream')
  @RequireCapabilities('notifications:stream')
  @ApiOperation({
    summary: 'Stream recipient-scoped notification change signals',
    description:
      'REST and PostgreSQL snapshots remain authoritative. Reconnect with Last-Event-ID.',
  })
  @ApiHeader({ name: 'Last-Event-ID', required: false })
  @ApiProduces('text/event-stream')
  @ApiPayloadTooLargeResponse({
    type: ApiErrorEnvelopeDto,
    description:
      'The persisted reconnect backlog exceeds the safe SSE recovery window; recover through the inbox API.',
  })
  @ApiOkResponse({
    description:
      'SSE frames named notification. Each frame id is a decimal delivery sequence and data is NotificationItemDto JSON.',
    schema: {
      type: 'string',
      example:
        'id: 42\\nevent: notification\\ndata: {"id":"0198a4ae-0000-7000-8000-000000000003","deliverySequence":"42","type":"queue.patient.called","priority":"high","actionCode":"queue.patient.called","occurredAt":"2026-07-30T08:00:00.000Z","createdAt":"2026-07-30T08:00:01.000Z","readAt":null}\\n\\n',
    },
  })
  @Header('Cache-Control', 'no-cache, no-transform')
  async events(
    @Req() req: AuthenticatedRequest,
    @Res() response: Response,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<void> {
    const access = this.access(req);
    const rawLastEventId = headers['last-event-id'];
    const lastEventId = Array.isArray(rawLastEventId)
      ? rawLastEventId[0]
      : rawLastEventId;
    const after = await this.service.parseLastEventId(access, lastEventId);
    await this.stream.open(access, after, response);
  }

  private access(req: AuthenticatedRequest): NotificationAccess {
    if (!req.principal)
      throw new Error('Authentication guard invariant is broken.');
    return {
      actorId: req.principal.id,
      sessionId: req.principal.sessionId,
      patient: req.principal.kind === 'patient',
      ...(req.tenant?.organizationId
        ? { organizationId: req.tenant.organizationId }
        : {}),
      ...(req.tenant?.clinicId ? { clinicId: req.tenant.clinicId } : {}),
    };
  }
}
