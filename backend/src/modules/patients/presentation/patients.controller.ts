import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
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
  description: 'The authenticated identity is not an eligible patient.',
})
@UseGuards(JwtAuthGuard)
@RequireCapabilities('patient:self')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get the authenticated patient account and current patient',
  })
  @ApiOkResponse({ description: 'Patient account projection.' })
  me(@Req() request: AuthenticatedRequest) {
    return this.patients.me(this.userId(request));
  }

  @Get('profiles')
  @ApiOperation({
    summary: 'List patient profiles owned by the authenticated account',
  })
  @ApiOkResponse({ type: PatientProfileResponseDto, isArray: true })
  profiles(@Req() request: AuthenticatedRequest) {
    return this.patients.list(this.userId(request));
  }

  @Get('profiles/:id')
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
  @HttpCode(200)
  @ApiOperation({ summary: 'Choose the current active patient profile' })
  @ApiOkResponse({ description: 'Updated patient account projection.' })
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

  private userId(request: AuthenticatedRequest): string {
    if (!request.principal || request.principal.kind !== 'patient')
      throw new Error('Patient guard invariant is broken.');
    return request.principal.id;
  }
}
