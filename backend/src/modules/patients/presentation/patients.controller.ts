import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PatientService } from '../application/patient.service';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import {
  ActivatePatientProfileDto,
  ArchivePatientProfileDto,
  CreatePatientProfileDto,
  PatientDirectoryPageResponseDto,
  PatientDirectoryProfileDetailResponseDto,
  PatientDirectoryProfileParamsDto,
  PatientDirectorySearchQueryDto,
  PatientAccountResponseDto,
  PatientProfileParamsDto,
  PatientProfileResponseDto,
  UpdatePatientProfileDto,
} from './patient.dto';

@ApiTags('patients')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Bearer token is missing, invalid, or expired.',
})
@ApiBadRequestResponse({ description: 'Request validation failed.' })
@ApiForbiddenResponse({
  description:
    'The authenticated identity lacks the required capability or tenant context.',
})
@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientService) {}

  @Get('directory')
  @RequireCapabilities('patient:directory:read')
  @ApiOperation({ summary: 'Search the clinic-scoped patient directory' })
  @ApiOkResponse({ type: PatientDirectoryPageResponseDto })
  @ApiServiceUnavailableResponse({
    description: 'A required staff-read audit could not be recorded.',
  })
  directory(
    @Req() request: AuthenticatedRequest,
    @Query() query: PatientDirectorySearchQueryDto,
  ) {
    return this.patients.searchDirectory(
      this.directoryAccess(request),
      {
        q: query.q,
        pageSize: query.pageSize ?? 10,
        ...(query.cursor ? { cursor: query.cursor } : {}),
      },
      request.requestId,
    );
  }

  @Get('directory/:patientProfileId')
  @RequireCapabilities('patient:directory:read')
  @ApiOperation({ summary: 'Get one clinic-scoped patient profile view' })
  @ApiOkResponse({ type: PatientDirectoryProfileDetailResponseDto })
  @ApiNotFoundResponse({
    description: 'No active patient is visible in the authenticated clinic.',
  })
  @ApiServiceUnavailableResponse({
    description: 'A required staff-read audit could not be recorded.',
  })
  directoryProfile(
    @Req() request: AuthenticatedRequest,
    @Param() params: PatientDirectoryProfileParamsDto,
  ) {
    return this.patients.getDirectoryProfile(
      this.directoryAccess(request),
      params.patientProfileId,
      request.requestId,
    );
  }

  @Get('me')
  @RequireCapabilities('patient:self')
  @ApiOperation({
    summary: 'Get the authenticated patient account and current patient',
  })
  @ApiOkResponse({ type: PatientAccountResponseDto })
  me(@Req() request: AuthenticatedRequest) {
    return this.patients.me(this.userId(request));
  }

  @Get('profiles')
  @RequireCapabilities('patient:self')
  @ApiOperation({
    summary: 'List patient profiles owned by the authenticated account',
  })
  @ApiOkResponse({ type: PatientProfileResponseDto, isArray: true })
  profiles(@Req() request: AuthenticatedRequest) {
    return this.patients.list(this.userId(request));
  }

  @Get('profiles/:id')
  @RequireCapabilities('patient:self')
  @ApiOperation({ summary: 'Get one owned patient profile' })
  @ApiOkResponse({ type: PatientProfileResponseDto })
  @ApiNotFoundResponse({
    description: 'Profile does not exist in this patient account.',
  })
  profile(
    @Req() request: AuthenticatedRequest,
    @Param() params: PatientProfileParamsDto,
  ) {
    return this.patients.get(this.userId(request), params.id);
  }

  @Post('profiles')
  @RequireCapabilities('patient:self')
  @ApiOperation({ summary: 'Create a self or family-member patient profile' })
  @ApiCreatedResponse({ type: PatientProfileResponseDto })
  @ApiConflictResponse({
    description: 'Self-profile invariant would be violated.',
  })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreatePatientProfileDto,
  ) {
    return this.patients.create(this.userId(request), body, request.requestId);
  }

  @Patch('profiles/:id')
  @RequireCapabilities('patient:self')
  @ApiOperation({
    summary: 'Update an owned active profile using optimistic concurrency',
  })
  @ApiOkResponse({ type: PatientProfileResponseDto })
  @ApiConflictResponse({
    description: 'Profile is archived or its version is stale.',
  })
  update(
    @Req() request: AuthenticatedRequest,
    @Param() params: PatientProfileParamsDto,
    @Body() body: UpdatePatientProfileDto,
  ) {
    return this.patients.update(
      this.userId(request),
      params.id,
      body,
      request.requestId,
    );
  }

  @Post('active')
  @RequireCapabilities('patient:self')
  @HttpCode(200)
  @ApiOperation({ summary: 'Choose the current active patient profile' })
  @ApiOkResponse({ type: PatientAccountResponseDto })
  @ApiConflictResponse({
    description: 'Archived profiles cannot become active.',
  })
  activate(
    @Req() request: AuthenticatedRequest,
    @Body() body: ActivatePatientProfileDto,
  ) {
    return this.patients.activate(
      this.userId(request),
      body.profileId,
      request.requestId,
    );
  }

  @Delete('profiles/:id')
  @RequireCapabilities('patient:self')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Archive a family-member profile; no physical deletion occurs',
  })
  @ApiConflictResponse({
    description: 'Profile is active, archived, or its version is stale.',
  })
  archive(
    @Req() request: AuthenticatedRequest,
    @Param() params: PatientProfileParamsDto,
    @Body() body: ArchivePatientProfileDto,
  ) {
    return this.patients.archive(
      this.userId(request),
      params.id,
      body.version,
      request.requestId,
    );
  }

  private directoryAccess(request: AuthenticatedRequest) {
    if (!request.principal) {
      throw new Error('Authentication guard invariant is broken.');
    }
    const organizationId = request.tenant?.organizationId;
    const clinicId = request.tenant?.clinicId;
    if (!organizationId || !clinicId) {
      throw new ForbiddenException('Staff tenant context is required.');
    }
    return {
      actorId: request.principal.id,
      organizationId,
      clinicId,
    };
  }

  private userId(request: AuthenticatedRequest): string {
    if (!request.principal || request.principal.kind !== 'patient')
      throw new Error('Patient guard invariant is broken.');
    return request.principal.id;
  }
}
