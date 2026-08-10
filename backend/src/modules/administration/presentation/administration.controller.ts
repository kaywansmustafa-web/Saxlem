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
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdministrationService } from '../application/administration.service';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import type {
  ClinicRecord,
  OrganizationRecord,
} from '../domain/administration';
import {
  AdministrationListQueryDto,
  ClinicListQueryDto,
  ClinicPageResponseDto,
  ClinicParamsDto,
  ClinicResponseDto,
  CreateClinicDto,
  CreateOrganizationDto,
  OrganizationPageResponseDto,
  OrganizationParamsDto,
  OrganizationResponseDto,
} from './administration.dto';

const idempotency = {
  name: 'Idempotency-Key',
  required: true,
  schema: { type: 'string', minLength: 8, maxLength: 128 },
  description:
    'Printable ASCII command key bound to actor, operation, and request body.',
};

@ApiTags('administration')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Bearer token is missing, invalid, or expired.',
})
@ApiForbiddenResponse({
  description: 'The platform administration capability is required.',
})
@ApiBadRequestResponse({
  description: 'Request validation or cursor validation failed.',
})
@UseGuards(JwtAuthGuard)
@RequireCapabilities('platform:administration')
@Controller('administration')
export class AdministrationController {
  constructor(private readonly administration: AdministrationService) {}

  @Get('organizations')
  @ApiOperation({ summary: 'List organizations for platform administration' })
  @ApiOkResponse({ type: OrganizationPageResponseDto })
  async organizations(
    @Req() request: AuthenticatedRequest,
    @Query() query: AdministrationListQueryDto,
  ) {
    const page = await this.administration.organizations(
      this.access(request),
      query,
    );
    return {
      items: page.items.map((item) => this.organization(item)),
      nextCursor: page.nextCursor,
    };
  }

  @Post('organizations')
  @ApiOperation({ summary: 'Create an active organization' })
  @ApiHeader(idempotency)
  @ApiCreatedResponse({ type: OrganizationResponseDto })
  @ApiConflictResponse({
    description: 'The idempotency key conflicts with another command.',
  })
  async createOrganization(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateOrganizationDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.organization(
      await this.administration.createOrganization(
        this.access(request),
        body.name,
        request.requestId,
        key,
      ),
    );
  }

  @Get('organizations/:organizationId')
  @ApiOperation({
    summary: 'Get organization details for platform administration',
  })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiNotFoundResponse({ description: 'Organization was not found.' })
  async organizationDetail(@Param() params: OrganizationParamsDto) {
    return this.organization(
      await this.administration.organization(params.organizationId),
    );
  }

  @Get('clinics')
  @ApiOperation({ summary: 'List clinics for platform administration' })
  @ApiOkResponse({ type: ClinicPageResponseDto })
  async clinics(
    @Req() request: AuthenticatedRequest,
    @Query() query: ClinicListQueryDto,
  ) {
    const page = await this.administration.clinics(this.access(request), query);
    return {
      items: page.items.map((item) => this.clinic(item)),
      nextCursor: page.nextCursor,
    };
  }

  @Post('clinics')
  @ApiOperation({
    summary: 'Create an active clinic in an active organization',
  })
  @ApiHeader(idempotency)
  @ApiCreatedResponse({ type: ClinicResponseDto })
  @ApiNotFoundResponse({ description: 'Active organization was not found.' })
  @ApiConflictResponse({
    description:
      'Clinic code already exists in the organization or the idempotency key conflicts.',
  })
  async createClinic(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateClinicDto,
    @Headers('idempotency-key') key = '',
  ) {
    return this.clinic(
      await this.administration.createClinic(
        this.access(request),
        body,
        request.requestId,
        key,
      ),
    );
  }

  @Get('clinics/:clinicId')
  @ApiOperation({ summary: 'Get clinic details for platform administration' })
  @ApiOkResponse({ type: ClinicResponseDto })
  @ApiNotFoundResponse({ description: 'Clinic was not found.' })
  async clinicDetail(@Param() params: ClinicParamsDto) {
    return this.clinic(await this.administration.clinic(params.clinicId));
  }

  private access(request: AuthenticatedRequest) {
    if (
      !request.principal ||
      request.principal.kind !== 'platformAdministrator'
    )
      throw new Error('Platform authorization guard invariant is broken.');
    return { actorId: request.principal.id };
  }

  private organization(value: OrganizationRecord): OrganizationResponseDto {
    return { ...value };
  }

  private clinic(value: ClinicRecord): ClinicResponseDto {
    return { ...value };
  }
}
