import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from '../../doctors/presentation/doctor.dto';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import { ReceiptService } from '../application/receipt.service';
import {
  ReceiptAppointmentParamsDto,
  ReceiptDto,
  ReceiptListQueryDto,
  ReceiptPageDto,
} from './receipt.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireCapabilities('patient:self')
@Controller()
export class ReceiptsController {
  constructor(private readonly receipts: ReceiptService) {}

  @Get('patients/me/payments')
  @ApiOperation({
    summary: 'My payments, newest first',
    description:
      'Every visit paid by the account’s profiles, online or at the counter, including refunds.',
  })
  @ApiOkResponse({ type: ReceiptPageDto })
  list(
    @Req() req: AuthenticatedRequest,
    @Query() query: ReceiptListQueryDto,
  ): Promise<ReceiptPageDto> {
    return this.receipts.list(this.user(req), query.cursor, query.pageSize);
  }

  @Get('appointments/:id/receipt')
  @ApiOperation({ summary: 'The receipt for a paid visit' })
  @ApiOkResponse({ type: ReceiptDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  receipt(
    @Req() req: AuthenticatedRequest,
    @Param() params: ReceiptAppointmentParamsDto,
  ): Promise<ReceiptDto> {
    return this.receipts.forAppointment(this.user(req), params.id);
  }

  private user(req: AuthenticatedRequest): string {
    if (!req.principal)
      throw new Error('Authentication guard invariant is broken.');
    return req.principal.id;
  }
}
