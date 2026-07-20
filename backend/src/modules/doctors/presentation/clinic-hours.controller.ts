import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DoctorScheduleService } from '../application/doctor-schedule.service';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import { ApiErrorEnvelopeDto } from './doctor.dto';
import { ClinicHoursResponseDto, ClinicParamsDto } from './doctor-schedule.dto';
import { DoctorScheduleDtoMapper } from './doctor-schedule-dto.mapper';
import type { DoctorAccessContext } from '../application/doctor.service';

@ApiTags('clinic schedules')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
@ApiForbiddenResponse({ type: ApiErrorEnvelopeDto })
@ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
@ApiServiceUnavailableResponse({
  description: 'A required staff-read audit could not be recorded.',
  type: ApiErrorEnvelopeDto,
})
@UseGuards(JwtAuthGuard)
@RequireCapabilities('clinic:hours:read')
@Controller('clinics')
export class ClinicHoursController {
  constructor(
    private readonly schedules: DoctorScheduleService,
    private readonly mapper: DoctorScheduleDtoMapper,
  ) {}

  @Get(':id/hours')
  @ApiOperation({
    summary: 'Get active clinic working hours',
    description:
      'Recurring periods are interpreted in the clinic IANA timezone. No appointment slots are produced.',
  })
  @ApiOkResponse({ type: ClinicHoursResponseDto })
  @ApiNotFoundResponse({
    description: 'Clinic is absent, inactive, or outside the tenant.',
    type: ApiErrorEnvelopeDto,
  })
  async hours(
    @Req() request: AuthenticatedRequest,
    @Param() params: ClinicParamsDto,
  ) {
    return this.mapper.clinicHours(
      await this.schedules.clinicHours(
        this.access(request),
        params.id,
        request.requestId,
      ),
    );
  }

  private access(request: AuthenticatedRequest): DoctorAccessContext {
    if (!request.principal)
      throw new Error('Authentication guard invariant is broken.');
    return {
      actorId: request.principal.id,
      patient: request.principal.kind === 'patient',
      platformAdministrator: request.principal.kind === 'platformAdministrator',
      doctor: request.principal.capabilities.has('doctor:workspace:read'),
      organizationId: request.tenant?.organizationId,
      clinicId: request.tenant?.clinicId,
    };
  }
}
