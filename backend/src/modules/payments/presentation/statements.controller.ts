import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from '../../doctors/presentation/doctor.dto';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import {
  StatementService,
  type StatementAccess,
} from '../application/statement.service';
import {
  SettleStatementDto,
  StatementDocumentDto,
  StatementListDto,
  StatementListQueryDto,
  StatementParamsDto,
} from './statement.dto';

function statementAccess(req: AuthenticatedRequest): StatementAccess {
  if (!req.principal)
    throw new Error('Authentication guard invariant is broken.');
  const doctorIds =
    req.tenant?.doctorIds ??
    (req.tenant?.ownDoctorId ? [req.tenant.ownDoctorId] : undefined);
  return {
    actorId: req.principal.id,
    platformAdministrator: req.principal.kind === 'platformAdministrator',
    ...(req.tenant?.organizationId
      ? { organizationId: req.tenant.organizationId }
      : {}),
    ...(doctorIds ? { doctorIds } : {}),
  };
}

@ApiTags('statements')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
@ApiForbiddenResponse({ type: ApiErrorEnvelopeDto })
@ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
@UseGuards(JwtAuthGuard)
@Controller()
export class StatementsController {
  constructor(private readonly statements: StatementService) {}

  @Get('statements')
  @RequireCapabilities('billing:read')
  @ApiOperation({
    summary: "Each doctor's 30-day statements: running, due and settled",
  })
  @ApiOkResponse({ type: StatementListDto })
  list(
    @Req() req: AuthenticatedRequest,
    @Query() query: StatementListQueryDto,
  ) {
    return this.statements.list(statementAccess(req), query);
  }

  @Get('statements/:organizationId/:doctorId/:cycleNumber')
  @RequireCapabilities('billing:read')
  @ApiOperation({ summary: 'One full statement, for screen and print' })
  @ApiOkResponse({ type: StatementDocumentDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  document(@Req() req: AuthenticatedRequest, @Param() p: StatementParamsDto) {
    return this.statements.document(
      statementAccess(req),
      p.organizationId,
      p.doctorId,
      p.cycleNumber,
    );
  }

  @Post(
    'platform/organizations/:organizationId/doctors/:doctorId/statements/:cycleNumber/settlement',
  )
  @HttpCode(200)
  @RequireCapabilities('payment:payout:manage')
  @ApiOperation({
    summary: 'Record that a statement was paid, in cash or by FIB',
  })
  @ApiOkResponse({ type: StatementDocumentDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  settle(
    @Req() req: AuthenticatedRequest,
    @Param() p: StatementParamsDto,
    @Body() body: SettleStatementDto,
  ) {
    return this.statements.settle(
      statementAccess(req),
      p.organizationId,
      p.doctorId,
      p.cycleNumber,
      body,
      req.requestId,
    );
  }
}
