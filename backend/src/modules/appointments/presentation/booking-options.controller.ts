import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { AppointmentService } from '../application/appointment.service';
import type { AppointmentAccess } from '../domain/appointment';
import {
  BookingOptionsQueryDto,
  BookingOptionsResponseDto,
  DoctorBookingParamsDto,
} from './appointment.dto';
import { BookingOptionsDtoMapper } from './booking-options-dto.mapper';

@ApiTags('appointments')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
@ApiForbiddenResponse({ type: ApiErrorEnvelopeDto })
@ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
@UseGuards(JwtAuthGuard)
@Controller('doctors')
export class BookingOptionsController {
  constructor(
    private readonly service: AppointmentService,
    private readonly mapper: BookingOptionsDtoMapper,
  ) {}

  @Get(':doctorId/booking-options')
  @RequireCapabilities('appointment:create')
  @ApiOperation({
    summary: 'Get patient-safe authoritative booking options',
    description:
      'Returns advisory slots derived from active doctor-clinic schedules and current appointment conflicts. Appointment creation always revalidates availability. Empty days are successful results. Operational schedule internals are never returned.',
  })
  @ApiOkResponse({ type: BookingOptionsResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  async options(
    @Req() request: AuthenticatedRequest,
    @Param() params: DoctorBookingParamsDto,
    @Query() query: BookingOptionsQueryDto,
  ) {
    const access = this.access(request);
    if (!access.patient)
      throw new ForbiddenException('Booking options are patient-only.');
    return this.mapper.map(
      await this.service.bookingOptions(
        access,
        params.doctorId,
        query.clinicId,
        query.patientProfileId,
        query.appointmentType,
        query.dateFrom,
        query.dateTo,
        request.requestId,
      ),
    );
  }

  @Get(':doctorId/clinic-slots')
  @RequireCapabilities('appointment:slots:read')
  @ApiOperation({
    summary: 'Free slots for reception (phone and walk-in bookings)',
    description:
      "Same authoritative slot generation as the patient app, scoped to the staff member's clinic. Every booking origin (app, phone, walk-in) blocks the same slots, so the two channels can never overlap. Includes the slot that started within the past-tolerance window so a walk-in can take it.",
  })
  @ApiOkResponse({ type: BookingOptionsResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  async clinicSlots(
    @Req() request: AuthenticatedRequest,
    @Param() params: DoctorBookingParamsDto,
    @Query() query: BookingOptionsQueryDto,
  ) {
    if (!request.principal)
      throw new Error('Authentication guard invariant is broken.');
    const organizationId = request.tenant?.organizationId;
    const clinicId = request.tenant?.clinicId;
    if (
      request.principal.kind === 'patient' ||
      !organizationId ||
      clinicId !== query.clinicId
    )
      throw new ForbiddenException('Staff tenant context is required.');
    return this.mapper.map(
      await this.service.bookingOptions(
        {
          actorId: request.principal.id,
          patient: false,
          doctor: false,
          platformAdministrator: false,
          organizationId,
          clinicId,
          doctorIds: request.tenant?.doctorIds,
        },
        params.doctorId,
        query.clinicId,
        query.patientProfileId,
        query.appointmentType,
        query.dateFrom,
        query.dateTo,
        request.requestId,
      ),
    );
  }

  private access(request: AuthenticatedRequest): AppointmentAccess {
    if (!request.principal)
      throw new Error('Authentication guard invariant is broken.');
    return {
      actorId: request.principal.id,
      patient: request.principal.kind === 'patient',
      doctor: false,
      platformAdministrator: false,
    };
  }
}
