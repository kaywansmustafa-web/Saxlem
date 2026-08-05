import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
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
import {
  DoctorService,
  type DoctorAccessContext,
} from '../application/doctor.service';
import { DoctorScheduleService } from '../application/doctor-schedule.service';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import {
  ApiErrorEnvelopeDto,
  DoctorDetailResponseDto,
  DoctorDiscoveryOptionsResponseDto,
  DoctorDiscoveryOptionsQueryDto,
  DoctorPageResponseDto,
  DoctorParamsDto,
  DoctorProfessionalProfileResponseDto,
  DoctorSearchDto,
  SpecialtyResponseDto,
} from './doctor.dto';
import { DoctorDtoMapper } from './doctor-dto.mapper';
import {
  DoctorScheduleResponseDto,
  ScheduleAvailabilityResponseDto,
  ScheduleQueryDto,
} from './doctor-schedule.dto';
import { DoctorScheduleDtoMapper } from './doctor-schedule-dto.mapper';

@ApiTags('doctors')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Bearer token is missing, invalid, or expired.',
  type: ApiErrorEnvelopeDto,
})
@ApiForbiddenResponse({
  description: 'Role, capability, visibility, or tenant policy denied access.',
  type: ApiErrorEnvelopeDto,
})
@ApiBadRequestResponse({
  description: 'Filter, identifier, or pagination validation failed.',
  type: ApiErrorEnvelopeDto,
})
@UseGuards(JwtAuthGuard)
@RequireCapabilities('doctor:directory:read')
@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly doctors: DoctorService,
    private readonly mapper: DoctorDtoMapper,
    private readonly schedules: DoctorScheduleService,
    private readonly scheduleMapper: DoctorScheduleDtoMapper,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Search the visible doctor directory' })
  @ApiOkResponse({ type: DoctorPageResponseDto })
  search(
    @Req() request: AuthenticatedRequest,
    @Query() query: DoctorSearchDto,
  ) {
    return this.doctors
      .search(this.access(request), query)
      .then((page) => this.mapper.page(page));
  }

  @Get('discovery-options')
  @ApiOperation({
    summary: 'Get authoritative doctor discovery filter options',
    description:
      'Returns only options represented by active doctors, active specialties, active clinics, and active doctor-clinic assignments visible to the authenticated directory scope.',
  })
  @ApiOkResponse({ type: DoctorDiscoveryOptionsResponseDto })
  discoveryOptions(
    @Req() request: AuthenticatedRequest,
    @Query() query: DoctorDiscoveryOptionsQueryDto,
  ) {
    void query;
    return this.doctors
      .discoveryOptions(this.access(request))
      .then((options) => this.mapper.discoveryOptions(options));
  }

  @Get(':id')
  @ApiServiceUnavailableResponse({
    description:
      'A required security audit could not be recorded. Retry later.',
    type: ApiErrorEnvelopeDto,
  })
  @ApiOperation({ summary: 'Get one visible doctor' })
  @ApiOkResponse({ type: DoctorDetailResponseDto })
  @ApiNotFoundResponse({
    description:
      'Doctor is absent, archived, inactive for a patient, or outside the tenant.',
    type: ApiErrorEnvelopeDto,
  })
  get(@Req() request: AuthenticatedRequest, @Param() params: DoctorParamsDto) {
    return this.doctors
      .get(this.access(request), params.id, request.requestId, 'details')
      .then((doctor) => this.mapper.detail(doctor));
  }

  @Get(':id/profile')
  @ApiServiceUnavailableResponse({
    description:
      'A required security audit could not be recorded. Retry later.',
    type: ApiErrorEnvelopeDto,
  })
  @ApiOperation({ summary: 'Get the doctor professional profile' })
  @ApiOkResponse({ type: DoctorProfessionalProfileResponseDto })
  @ApiNotFoundResponse({
    description: 'Doctor is not visible.',
    type: ApiErrorEnvelopeDto,
  })
  profile(
    @Req() request: AuthenticatedRequest,
    @Param() params: DoctorParamsDto,
  ) {
    return this.doctors
      .get(this.access(request), params.id, request.requestId, 'profile')
      .then((doctor) => this.mapper.profile(doctor));
  }

  @Get(':id/specialties')
  @ApiServiceUnavailableResponse({
    description:
      'A required security audit could not be recorded. Retry later.',
    type: ApiErrorEnvelopeDto,
  })
  @ApiOperation({ summary: 'Get canonical specialties assigned to the doctor' })
  @ApiOkResponse({ type: SpecialtyResponseDto, isArray: true })
  @ApiNotFoundResponse({
    description: 'Doctor is not visible.',
    type: ApiErrorEnvelopeDto,
  })
  async specialties(
    @Req() request: AuthenticatedRequest,
    @Param() params: DoctorParamsDto,
  ) {
    return this.mapper.specialties(
      await this.doctors.get(
        this.access(request),
        params.id,
        request.requestId,
        'specialties',
      ),
    );
  }

  @Get(':id/availability')
  @RequireCapabilities('doctor:availability:read')
  @ApiOperation({
    summary: 'Calculate descriptive doctor availability',
    description:
      'Patient-safe descriptive availability evaluated in the clinic IANA timezone. Operational breaks, leave, holidays, exceptions, and precedence metadata are never exposed. This endpoint never creates appointment slots.',
  })
  @ApiOkResponse({ type: ScheduleAvailabilityResponseDto })
  @ApiNotFoundResponse({
    description: 'Doctor is not visible.',
    type: ApiErrorEnvelopeDto,
  })
  async availability(
    @Req() request: AuthenticatedRequest,
    @Param() params: DoctorParamsDto,
    @Query() query: ScheduleQueryDto,
  ) {
    return this.scheduleMapper.availability(
      await this.schedules.availability(
        this.access(request),
        params.id,
        query.clinicId,
        query.at ? new Date(query.at) : new Date(),
        request.requestId,
      ),
    );
  }

  @Get(':id/schedule')
  @RequireCapabilities('doctor:schedule:read')
  @ApiServiceUnavailableResponse({
    description:
      'A required staff-read audit could not be recorded. Retry later.',
    type: ApiErrorEnvelopeDto,
  })
  @ApiOperation({
    summary: 'Get the active read-only doctor schedule',
    description:
      'Staff-only operational projection. Returns every active temporal record that overlaps the closed-open window from 366 days before `at` through 366 days after `at`; there is no hidden record cap. Recurring periods are same-day local wall-clock rules in the clinic IANA timezone. Overnight work must be split at 24:00 into two weekday rows. Leave, holidays, and exceptions are UTC instants. No appointment slots are returned.',
  })
  @ApiOkResponse({ type: DoctorScheduleResponseDto })
  @ApiNotFoundResponse({
    description:
      'Doctor is absent, inactive, archived, has no active clinic, or is outside the tenant.',
    type: ApiErrorEnvelopeDto,
  })
  async schedule(
    @Req() request: AuthenticatedRequest,
    @Param() params: DoctorParamsDto,
    @Query() query: ScheduleQueryDto,
  ) {
    return this.scheduleMapper.schedule(
      await this.schedules.schedule(
        this.access(request),
        params.id,
        query.clinicId,
        request.requestId,
        query.at ? new Date(query.at) : new Date(),
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
