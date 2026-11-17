import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import { PayoutService } from '../application/payout.service';
import {
  DoctorPayoutParamsDto,
  DoctorPayoutProfileDto,
  LedgerQueryDto,
  LedgerResponseDto,
  MonthQueryDto,
  OrganizationPaymentParamsDto,
  PaymentSettingsDto,
  PayoutDto,
  PayoutProfileDto,
  PayoutSummaryDto,
  SaveDoctorPayoutProfileDto,
  SavePayoutProfileDto,
  SettlePayoutDto,
} from './payment.dto';
import { paymentAccess } from './payments.controller';

@ApiTags('payouts')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
@ApiForbiddenResponse({ type: ApiErrorEnvelopeDto })
@ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
@UseGuards(JwtAuthGuard)
@RequireCapabilities('payment:payout:manage')
@Controller('platform')
export class PayoutsController {
  constructor(private readonly payouts: PayoutService) {}

  @Get('payments/settings')
  @ApiOperation({ summary: 'How online payments are collected' })
  @ApiOkResponse({ type: PaymentSettingsDto })
  settings() {
    return this.payouts.settings();
  }

  @Get('payments/ledger')
  @ApiOperation({
    summary: 'Payments ledger',
    description:
      'Every payment in a Baghdad month: patient, amount, doctor, clinic, when booked and when paid.',
  })
  @ApiOkResponse({ type: LedgerResponseDto })
  ledger(@Query() query: LedgerQueryDto) {
    return this.payouts.ledger(query);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Monthly settlement for every doctor' })
  @ApiOkResponse({ type: PayoutSummaryDto })
  summary(@Query() query: MonthQueryDto) {
    return this.payouts.summary(query.month);
  }

  @Get('organizations/:organizationId/doctors/:doctorId/payouts')
  @ApiOperation({ summary: 'One doctor’s monthly settlement' })
  @ApiOkResponse({ type: PayoutDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  detail(
    @Param() params: DoctorPayoutParamsDto,
    @Query() query: MonthQueryDto,
  ) {
    return this.payouts.detail(
      params.organizationId,
      params.doctorId,
      query.month,
    );
  }

  @Post('organizations/:organizationId/doctors/:doctorId/payouts')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Record a doctor’s monthly settlement as paid',
    description:
      'Only for a month that has ended. Fails if the amounts changed since they were shown.',
  })
  @ApiOkResponse({ type: PayoutDto })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  settle(
    @Req() req: AuthenticatedRequest,
    @Param() params: DoctorPayoutParamsDto,
    @Body() body: SettlePayoutDto,
  ) {
    return this.payouts.settle(
      paymentAccess(req),
      params.organizationId,
      params.doctorId,
      body,
      req.requestId,
    );
  }

  @Get('organizations/:organizationId/doctors/:doctorId/payout-profile')
  @ApiOperation({ summary: 'Where a doctor’s payouts are sent' })
  @ApiOkResponse({ type: DoctorPayoutProfileDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  doctorProfile(@Param() params: DoctorPayoutParamsDto) {
    return this.payouts.doctorProfile(params.organizationId, params.doctorId);
  }

  @Put('organizations/:organizationId/doctors/:doctorId/payout-profile')
  @ApiOperation({ summary: 'Set where a doctor’s payouts are sent' })
  @ApiOkResponse({ type: DoctorPayoutProfileDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  saveDoctorProfile(
    @Req() req: AuthenticatedRequest,
    @Param() params: DoctorPayoutParamsDto,
    @Body() body: SaveDoctorPayoutProfileDto,
  ) {
    return this.payouts.saveDoctorProfile(
      paymentAccess(req),
      params.organizationId,
      params.doctorId,
      body,
      req.requestId,
    );
  }

  @Get('organizations/:organizationId/payout-profile')
  @ApiOperation({ summary: 'Online payments switch for an organization' })
  @ApiOkResponse({ type: PayoutProfileDto })
  profile(@Param() params: OrganizationPaymentParamsDto) {
    return this.payouts.profile(params.organizationId);
  }

  @Put('organizations/:organizationId/payout-profile')
  @ApiOperation({
    summary: 'Turn online payments on or off for an organization',
  })
  @ApiOkResponse({ type: PayoutProfileDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  saveProfile(
    @Req() req: AuthenticatedRequest,
    @Param() params: OrganizationPaymentParamsDto,
    @Body() body: SavePayoutProfileDto,
  ) {
    return this.payouts.saveProfile(
      paymentAccess(req),
      params.organizationId,
      body,
      req.requestId,
    );
  }
}
