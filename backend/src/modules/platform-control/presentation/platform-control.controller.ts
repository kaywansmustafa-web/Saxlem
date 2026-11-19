import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PlatformControlService } from '../application/platform-control.service';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import {
  AnalyticsRangeQueryDto,
  ActivateStaffDto,
  AddStaffMembershipDto,
  ActivationResultDto,
  AuditQueryDto,
  AuditEventPageResponseDto,
  CreateDocumentDto,
  CreateStaffDto,
  CreateStaffResponseDto,
  DoctorOnboardingDto,
  DoctorMutationResponseDto,
  DocumentResponseDto,
  ExecutiveAnalyticsResponseDto,
  LiveOperationDto,
  PatientDetailResponseDto,
  PatientPageResponseDto,
  OwnerSettingsResponseDto,
  PlatformPageQueryDto,
  PlatformDoctorDetailResponseDto,
  PlatformSpecialtyResponseDto,
  SearchQueryDto,
  SearchResultDto,
  StaffListQueryDto,
  StaffPageResponseDto,
  StaffResponseDto,
  UpdateDoctorAdminDto,
  UpdateStatusDto,
} from './platform-control.dto';

@ApiTags('platform-control')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Authentication is required.' })
@ApiForbiddenResponse({
  description: 'A global platform administrator session is required.',
})
@UseGuards(JwtAuthGuard)
@RequireCapabilities('platform:administration')
@Controller('platform')
export class PlatformControlController {
  constructor(private readonly service: PlatformControlService) {}

  @Get('staff')
  @ApiOkResponse({ type: StaffPageResponseDto })
  staff(@Req() req: AuthenticatedRequest, @Query() query: StaffListQueryDto) {
    this.actor(req);
    return this.service.staff(query);
  }
  @Get('staff/:id')
  @ApiOkResponse({ type: StaffResponseDto })
  staffDetail(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    this.actor(req);
    return this.service.staffDetail(id);
  }
  @Post('staff')
  @ApiCreatedResponse({ type: CreateStaffResponseDto })
  createStaff(@Req() req: AuthenticatedRequest, @Body() body: CreateStaffDto) {
    return this.service.createStaff(this.actor(req), body, req.requestId);
  }
  @Patch('staff/:id/status')
  @ApiOkResponse({ type: StaffResponseDto })
  staffStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateStatusDto,
  ) {
    return this.service.setStaffStatus(
      this.actor(req),
      id,
      body.status,
      req.requestId,
    );
  }
  @Post('staff/:id/memberships')
  @ApiCreatedResponse({ type: StaffResponseDto })
  addMembership(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: AddStaffMembershipDto,
  ) {
    return this.service.addStaffMembership(
      this.actor(req),
      id,
      body,
      req.requestId,
    );
  }
  @Delete('staff/:id/memberships/:membershipId')
  @ApiOkResponse({ type: StaffResponseDto })
  removeMembership(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
  ) {
    return this.service.removeStaffMembership(
      this.actor(req),
      id,
      membershipId,
      req.requestId,
    );
  }

  @Get('patients')
  @ApiOkResponse({ type: PatientPageResponseDto })
  patients(
    @Req() req: AuthenticatedRequest,
    @Query() query: PlatformPageQueryDto,
  ) {
    return this.service.patients(this.actor(req), query, req.requestId);
  }
  @Get('patients/:id')
  @ApiOkResponse({ type: PatientDetailResponseDto })
  patient(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.patientDetail(this.actor(req), id, req.requestId);
  }

  @Get('live-operations')
  @ApiOkResponse({ type: [LiveOperationDto] })
  live(@Req() req: AuthenticatedRequest, @Query() query: PlatformPageQueryDto) {
    this.actor(req);
    return this.service.liveOperations(query);
  }
  @Get('analytics/executive')
  @ApiOkResponse({ type: ExecutiveAnalyticsResponseDto })
  analytics(
    @Req() req: AuthenticatedRequest,
    @Query() query: AnalyticsRangeQueryDto,
  ) {
    this.actor(req);
    return this.service.analytics(query.from, query.to);
  }
  @Get('audit-events')
  @ApiOkResponse({ type: AuditEventPageResponseDto })
  audits(@Req() req: AuthenticatedRequest, @Query() query: AuditQueryDto) {
    this.actor(req);
    return this.service.audits(query);
  }
  @Get('search')
  @ApiOkResponse({ type: [SearchResultDto] })
  search(@Req() req: AuthenticatedRequest, @Query() query: SearchQueryDto) {
    return this.service.search(this.actor(req), query, req.requestId);
  }

  @Get('documents')
  @ApiOkResponse({ type: [DocumentResponseDto] })
  documents(
    @Req() req: AuthenticatedRequest,
    @Query() query: PlatformPageQueryDto,
  ) {
    this.actor(req);
    return this.service.documents(query);
  }
  @Post('documents')
  @ApiCreatedResponse({ type: DocumentResponseDto })
  createDocument(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateDocumentDto,
  ) {
    return this.service.createDocument(this.actor(req), body, req.requestId);
  }
  @Post('documents/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 26_214_400, files: 1, fields: 12 },
    }),
  )
  @ApiCreatedResponse({ type: DocumentResponseDto })
  uploadDocument(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateDocumentDto,
    @UploadedFile()
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
  ) {
    if (!file) throw new BadRequestException('A document file is required.');
    return this.service.uploadDocument(
      this.actor(req),
      body,
      file,
      req.requestId,
    );
  }
  @Get('documents/:id/download')
  async downloadDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.service.downloadDocument(
      this.actor(req),
      id,
      req.requestId,
    );
    response.setHeader('content-type', result.metadata.contentType);
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('cache-control', 'private, no-store');
    response.setHeader(
      'content-disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(result.metadata.filename)}`,
    );
    return new StreamableFile(result.content);
  }
  @Delete('documents/:id')
  @ApiOkResponse({ type: DocumentResponseDto })
  deleteDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.deleteDocument(this.actor(req), id, req.requestId);
  }

  @Post('doctors')
  @ApiCreatedResponse({ type: DoctorMutationResponseDto })
  onboardDoctor(
    @Req() req: AuthenticatedRequest,
    @Body() body: DoctorOnboardingDto,
  ) {
    return this.service.onboardDoctor(this.actor(req), body, req.requestId);
  }
  @Get('doctors/:id')
  @ApiOkResponse({ type: PlatformDoctorDetailResponseDto })
  doctorDetail(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    this.actor(req);
    return this.service.doctorDetail(id);
  }
  @Get('specialties')
  @ApiOkResponse({ type: [PlatformSpecialtyResponseDto] })
  specialties(@Req() req: AuthenticatedRequest) {
    this.actor(req);
    return this.service.specialties();
  }
  @Patch('doctors/:id')
  @ApiOkResponse({ type: DoctorMutationResponseDto })
  updateDoctor(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateDoctorAdminDto,
  ) {
    return this.service.updateDoctor(this.actor(req), id, body, req.requestId);
  }
  @Get('settings')
  @ApiOkResponse({ type: OwnerSettingsResponseDto })
  settings(@Req() req: AuthenticatedRequest) {
    return this.service.settings(this.actor(req));
  }

  private actor(req: AuthenticatedRequest): string {
    if (
      !req.principal ||
      req.principal.kind !== 'platformAdministrator' ||
      req.tenant?.organizationId ||
      req.tenant?.clinicId
    )
      throw new ForbiddenException(
        'A global platform administrator session is required.',
      );
    return req.principal.id;
  }
}

@ApiTags('authentication')
@Controller('auth/staff-activation')
export class StaffActivationController {
  constructor(private readonly service: PlatformControlService) {}

  @Post()
  @ApiOkResponse({ type: ActivationResultDto })
  activate(@Body() body: ActivateStaffDto) {
    return this.service.activateStaff(body.activationCredential, body.password);
  }
}
