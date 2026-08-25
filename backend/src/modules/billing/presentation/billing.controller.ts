import {
  Body,
  Controller,
  Get,
  Headers,
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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from '../../doctors/presentation/doctor.dto';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import { BillingService } from '../application/billing.service';
import type { BillingAccess } from '../domain/billing';
import {
  AssignBillingPlanDto,
  BillingIdParamsDto,
  BillingListQueryDto,
  BillingOrganizationParamsDto,
  BillingOrganizationQueryDto,
  BillingPlanResponseDto,
  BillingStatementResponseDto,
  BillingStatementDetailResponseDto,
  CommissionPageResponseDto,
  FinalizeBillingStatementDto,
  OrganizationPlanResponseDto,
} from './billing.dto';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
@ApiForbiddenResponse({ type: ApiErrorEnvelopeDto })
@ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}
  @Get('plans')
  @RequireCapabilities('billing:read')
  @ApiOkResponse({ type: [BillingPlanResponseDto] })
  plans(@Req() req: AuthenticatedRequest) {
    return this.billing.plans(this.access(req));
  }
  @Get('plans/:id')
  @RequireCapabilities('billing:read')
  @ApiOkResponse({ type: BillingPlanResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  plan(@Req() req: AuthenticatedRequest, @Param() p: BillingIdParamsDto) {
    return this.billing.plan(this.access(req), p.id);
  }
  @Get('organizations/:organizationId/plan')
  @RequireCapabilities('billing:read')
  @ApiOkResponse({ type: OrganizationPlanResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  organizationPlan(
    @Req() req: AuthenticatedRequest,
    @Param() p: BillingOrganizationParamsDto,
  ) {
    return this.billing.organizationPlan(this.access(req), p.organizationId);
  }
  @Post('organizations/:organizationId/plan-assignments')
  @RequireCapabilities('billing:plan:manage')
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiCreatedResponse({ type: OrganizationPlanResponseDto })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  assign(
    @Req() req: AuthenticatedRequest,
    @Param() p: BillingOrganizationParamsDto,
    @Body() body: AssignBillingPlanDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.billing.assignPlan(
      this.access(req),
      p.organizationId,
      body.planId,
      new Date(body.effectiveFrom),
      body.expectedVersion ?? null,
      key,
      req.requestId,
    );
  }
  @Get('commissions')
  @RequireCapabilities('billing:read')
  @ApiOkResponse({ type: CommissionPageResponseDto })
  commissions(
    @Req() req: AuthenticatedRequest,
    @Query() query: BillingListQueryDto,
  ) {
    return this.billing.commissions(
      this.access(req),
      query.organizationId,
      query.pageSize,
      query.cursor,
    );
  }
  @Get('statements/current')
  @RequireCapabilities('billing:read')
  @ApiOkResponse({ type: BillingStatementResponseDto })
  current(
    @Req() req: AuthenticatedRequest,
    @Query() query: BillingOrganizationQueryDto,
  ) {
    return this.billing.currentStatement(
      this.access(req),
      query.organizationId,
    );
  }
  @Get('statements')
  @RequireCapabilities('billing:read')
  @ApiOkResponse({ type: [BillingStatementResponseDto] })
  statements(
    @Req() req: AuthenticatedRequest,
    @Query() query: BillingOrganizationQueryDto,
  ) {
    return this.billing.statements(this.access(req), query.organizationId);
  }
  @Get('statements/:id')
  @RequireCapabilities('billing:read')
  @ApiOkResponse({ type: BillingStatementDetailResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  statement(@Req() req: AuthenticatedRequest, @Param() p: BillingIdParamsDto) {
    return this.billing.statement(this.access(req), p.id);
  }
  @Post('statements/:id/finalize')
  @RequireCapabilities('billing:statement:finalize')
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOkResponse({ type: BillingStatementResponseDto })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  finalize(
    @Req() req: AuthenticatedRequest,
    @Param() p: BillingIdParamsDto,
    @Body() body: FinalizeBillingStatementDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.billing.finalize(
      this.access(req),
      p.id,
      body.version,
      key,
      req.requestId,
    );
  }
  private access(req: AuthenticatedRequest): BillingAccess {
    if (!req.principal)
      throw new Error('Authentication guard invariant is broken.');
    return {
      actorId: req.principal.id,
      platformAdministrator: req.principal.kind === 'platformAdministrator',
      ...(req.tenant?.organizationId
        ? { organizationId: req.tenant.organizationId }
        : {}),
      ...(req.tenant?.clinicId ? { clinicId: req.tenant.clinicId } : {}),
    };
  }
}
