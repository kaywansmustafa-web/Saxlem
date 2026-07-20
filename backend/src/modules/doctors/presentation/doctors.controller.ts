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
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import {
  ApiErrorEnvelopeDto,
  DoctorAvailabilityResponseDto,
  DoctorDetailResponseDto,
  DoctorPageResponseDto,
  DoctorParamsDto,
  DoctorProfessionalProfileResponseDto,
  DoctorSearchDto,
  SpecialtyResponseDto,
} from './doctor.dto';
import { DoctorDtoMapper } from './doctor-dto.mapper';

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
@ApiServiceUnavailableResponse({
  description: 'A required security audit could not be recorded. Retry later.',
  type: ApiErrorEnvelopeDto,
})
@UseGuards(JwtAuthGuard)
@RequireCapabilities('doctor:directory:read')
@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly doctors: DoctorService,
    private readonly mapper: DoctorDtoMapper,
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

  @Get(':id')
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
  @ApiOperation({
    summary: 'Get read-only availability metadata; this is not a schedule',
  })
  @ApiOkResponse({ type: DoctorAvailabilityResponseDto })
  @ApiNotFoundResponse({
    description: 'Doctor is not visible.',
    type: ApiErrorEnvelopeDto,
  })
  async availability(
    @Req() request: AuthenticatedRequest,
    @Param() params: DoctorParamsDto,
  ) {
    return this.mapper.availability(
      await this.doctors.get(
        this.access(request),
        params.id,
        request.requestId,
        'availability',
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
      organizationId: request.tenant?.organizationId,
      clinicId: request.tenant?.clinicId,
    };
  }
}
