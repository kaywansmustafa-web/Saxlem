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
  ApiNoContentResponse,
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
import { PaymentService } from '../application/payment.service';
import type { PaymentAccess } from '../domain/payment';
import {
  ChoosePaymentDto,
  OrganizationPaymentParamsDto,
  PaymentAccountResponseDto,
  PaymentAppointmentParamsDto,
  PaymentCallbackParamsDto,
  PaymentListQueryDto,
  PaymentListResponseDto,
  PaymentOptionsQueryDto,
  PaymentOptionsResponseDto,
  PaymentResponseDto,
  SavePaymentAccountDto,
} from './payment.dto';

export function paymentAccess(req: AuthenticatedRequest): PaymentAccess {
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

@ApiTags('payments')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
@ApiForbiddenResponse({ type: ApiErrorEnvelopeDto })
@ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
@UseGuards(JwtAuthGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly service: PaymentService) {}

  @Get('payments/options')
  @RequireCapabilities('payment:read')
  @ApiOperation({
    summary: 'Payment methods a clinic accepts',
    description:
      'Shown before booking. "counter" is always available; "online" only when the clinic has connected its own merchant account.',
  })
  @ApiOkResponse({ type: PaymentOptionsResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  options(@Query() query: PaymentOptionsQueryDto) {
    return this.service.options(query.clinicId);
  }

  @Get('payments')
  @RequireCapabilities('payment:read')
  @ApiOperation({
    summary: 'Payments for a set of appointments (clinic staff)',
    description:
      'Appointments without a payment record are paid at the counter.',
  })
  @ApiOkResponse({ type: PaymentListResponseDto })
  async list(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaymentListQueryDto,
  ) {
    return {
      items: await this.service.listForAppointments(
        paymentAccess(req),
        query.appointmentId,
      ),
    };
  }

  @Get('appointments/:id/payment')
  @RequireCapabilities('payment:read')
  @ApiOperation({ summary: 'Read an appointment payment' })
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  get(
    @Req() req: AuthenticatedRequest,
    @Param() params: PaymentAppointmentParamsDto,
  ) {
    return this.service.get(paymentAccess(req), params.id, req.requestId);
  }

  @Post('appointments/:id/payment')
  @HttpCode(200)
  @RequireCapabilities('payment:choose')
  @ApiOperation({
    summary: 'Choose how to pay (patient)',
    description:
      'Pay at the counter, or pay online. Online returns a payment code, QR and app links; an unexpired link is reused, so repeating the call is safe.',
  })
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiServiceUnavailableResponse({ type: ApiErrorEnvelopeDto })
  choose(
    @Req() req: AuthenticatedRequest,
    @Param() params: PaymentAppointmentParamsDto,
    @Body() body: ChoosePaymentDto,
  ) {
    return this.service.choose(
      paymentAccess(req),
      params.id,
      body.method,
      req.requestId,
    );
  }

  @Post('appointments/:id/payment/refresh')
  @HttpCode(200)
  @RequireCapabilities('payment:read')
  @ApiOperation({ summary: 'Re-check an online payment with the provider' })
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiServiceUnavailableResponse({ type: ApiErrorEnvelopeDto })
  refresh(
    @Req() req: AuthenticatedRequest,
    @Param() params: PaymentAppointmentParamsDto,
  ) {
    return this.service.refresh(paymentAccess(req), params.id, req.requestId);
  }

  @Post('appointments/:id/payment/counter')
  @HttpCode(200)
  @RequireCapabilities('payment:record')
  @ApiOperation({
    summary: 'Record a counter payment (reception)',
    description:
      'Repeating the call is safe. Conflicts if the patient already paid in the app.',
  })
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  recordCounter(
    @Req() req: AuthenticatedRequest,
    @Param() params: PaymentAppointmentParamsDto,
  ) {
    return this.service.recordCounterPayment(
      paymentAccess(req),
      params.id,
      req.requestId,
    );
  }

  @Get('platform/organizations/:organizationId/payment-account')
  @RequireCapabilities('payment:account:manage')
  @ApiOperation({ summary: 'Read an organization’s online payment account' })
  @ApiOkResponse({ type: PaymentAccountResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  account(@Param() params: OrganizationPaymentParamsDto) {
    return this.service.account(params.organizationId);
  }

  @Put('platform/organizations/:organizationId/payment-account')
  @RequireCapabilities('payment:account:manage')
  @ApiOperation({
    summary: 'Connect an organization’s own merchant account',
    description:
      'Credentials are checked with the provider before saving and stored encrypted. The secret is never returned.',
  })
  @ApiOkResponse({ type: PaymentAccountResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiServiceUnavailableResponse({ type: ApiErrorEnvelopeDto })
  saveAccount(
    @Req() req: AuthenticatedRequest,
    @Param() params: OrganizationPaymentParamsDto,
    @Body() body: SavePaymentAccountDto,
  ) {
    return this.service.saveAccount(
      paymentAccess(req),
      params.organizationId,
      body,
      req.requestId,
    );
  }
}

@ApiTags('payments')
@Controller('payments/fib/callback')
export class PaymentCallbackController {
  constructor(private readonly service: PaymentService) {}

  @Post(':token')
  @HttpCode(204)
  @ApiOperation({
    summary: 'FIB status callback',
    description:
      'Public. The body is ignored: the status is always confirmed with FIB before anything changes.',
  })
  @ApiNoContentResponse()
  async callback(
    @Param() params: PaymentCallbackParamsDto,
    @Req() req: { requestId?: string },
  ) {
    await this.service.handleCallback(
      params.token,
      req.requestId ?? 'fib-callback',
    );
  }
}
