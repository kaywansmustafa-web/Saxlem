import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
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
import { BillingService } from '../application/billing.service';
import type { BillingAccess } from '../domain/billing';
import {
  AssignBillingPlanDto,
  AssignDoctorPlanDto,
  AssignOrganizationPlanByDayDto,
  BillingCycleStartDto,
  BillingDoctorParamsDto,
  BillingPlanStatusDto,
  BillingSetupDto,
  CommissionResponseDto,
  CreateBillingPlanDto,
  CreditCommissionDto,
  DoctorPlanAssignmentDto,
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
  @Post('plans')
  @RequireCapabilities('billing:plan:manage')
  @ApiOperation({ summary: 'Create a commission plan (0 IQD = free plan)' })
  @ApiCreatedResponse({ type: BillingPlanResponseDto })
  createPlan(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateBillingPlanDto,
  ) {
    return this.billing.createPlan(this.access(req), body, req.requestId);
  }
  @Put('plans/:id/status')
  @RequireCapabilities('billing:plan:manage')
  @ApiOperation({ summary: 'Turn a plan off (when unused) or back on' })
  @ApiOkResponse({ type: BillingPlanResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  planStatus(
    @Req() req: AuthenticatedRequest,
    @Param() p: BillingIdParamsDto,
    @Body() body: BillingPlanStatusDto,
  ) {
    return this.billing.setPlanStatus(
      this.access(req),
      p.id,
      body.status,
      req.requestId,
    );
  }
  @Get('organizations/:organizationId/setup')
  @RequireCapabilities('billing:read')
  @ApiOperation({
    summary: "Plan, 30-day cycle and each doctor's plan for an organization",
  })
  @ApiOkResponse({ type: BillingSetupDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  setup(
    @Req() req: AuthenticatedRequest,
    @Param() p: BillingOrganizationParamsDto,
  ) {
    return this.billing.setup(this.access(req), p.organizationId);
  }
  @Put('organizations/:organizationId/cycle-start')
  @RequireCapabilities('billing:plan:manage')
  @ApiOperation({ summary: 'Set the day billing cycles count from' })
  @ApiOkResponse({ type: BillingSetupDto })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  cycleStart(
    @Req() req: AuthenticatedRequest,
    @Param() p: BillingOrganizationParamsDto,
    @Body() body: BillingCycleStartDto,
  ) {
    return this.billing.setCycleStart(
      this.access(req),
      p.organizationId,
      body.startDate,
      req.requestId,
    );
  }
  @Post('organizations/:organizationId/plan-changes')
  @RequireCapabilities('billing:plan:manage')
  @ApiOperation({ summary: 'Move an organization to a plan from a day on' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiCreatedResponse({ type: OrganizationPlanResponseDto })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  async changePlan(
    @Req() req: AuthenticatedRequest,
    @Param() p: BillingOrganizationParamsDto,
    @Body() body: AssignOrganizationPlanByDayDto,
    @Headers('idempotency-key') key = '',
  ) {
    const access = this.access(req);
    const current = await this.billing
      .organizationPlan(access, p.organizationId)
      .catch(() => null);
    return this.billing.assignPlan(
      access,
      p.organizationId,
      body.planId,
      this.billing.fromDay(body.from),
      (current?.version as number | undefined) ?? null,
      key,
      req.requestId,
    );
  }
  @Post('organizations/:organizationId/doctors/:doctorId/plan')
  @RequireCapabilities('billing:plan:manage')
  @ApiOperation({
    summary: 'Give one doctor their own plan from a day on (or clear it)',
  })
  @ApiCreatedResponse({ type: DoctorPlanAssignmentDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  doctorPlan(
    @Req() req: AuthenticatedRequest,
    @Param() p: BillingDoctorParamsDto,
    @Body() body: AssignDoctorPlanDto,
  ) {
    return this.billing.assignDoctorPlan(
      this.access(req),
      p.organizationId,
      p.doctorId,
      body.planId,
      body.from,
      req.requestId,
    );
  }
  @Post('commissions/:id/credit')
  @RequireCapabilities('billing:plan:manage')
  @ApiOperation({ summary: 'Credit (waive) one charge, with a reason' })
  @ApiCreatedResponse({ type: CommissionResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  credit(
    @Req() req: AuthenticatedRequest,
    @Param() p: BillingIdParamsDto,
    @Body() body: CreditCommissionDto,
  ) {
    return this.billing.creditCommission(
      this.access(req),
      p.id,
      body.reason,
      req.requestId,
    );
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
      query.doctorId,
    );
  }
  @Get('statements/current')
  @RequireCapabilities('billing:read')
  @ApiOperation({
    summary: "This month's running statement for each doctor",
    description:
      'Each doctor is billed separately, so this returns one draft per doctor. A receptionist sees only their own doctors.',
  })
  @ApiOkResponse({ type: [BillingStatementResponseDto] })
  current(
    @Req() req: AuthenticatedRequest,
    @Query() query: BillingOrganizationQueryDto,
  ) {
    return this.billing.currentStatements(
      this.access(req),
      query.organizationId,
      query.doctorId,
    );
  }
  @Get('statements')
  @RequireCapabilities('billing:read')
  @ApiOkResponse({ type: [BillingStatementResponseDto] })
  statements(
    @Req() req: AuthenticatedRequest,
    @Query() query: BillingOrganizationQueryDto,
  ) {
    return this.billing.statements(
      this.access(req),
      query.organizationId,
      query.doctorId,
    );
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
      ...(req.tenant?.doctorIds
        ? { doctorIds: req.tenant.doctorIds }
        : req.tenant?.ownDoctorId
          ? { doctorIds: [req.tenant.ownDoctorId] }
          : {}),
    };
  }
}
