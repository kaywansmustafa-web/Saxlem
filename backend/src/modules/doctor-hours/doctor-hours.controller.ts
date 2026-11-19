import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../identity/presentation/require-capabilities.decorator';
import {
  DoctorHoursService,
  type ClinicScope,
  type HoursActor,
} from './doctor-hours.service';
import { doctorLanguages } from '../doctors/domain/doctor';
import { PERIODS_MAX } from './hours-rules';

class PeriodDto {
  @ApiProperty({ description: '0 = Sunday … 6 = Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;
  @ApiProperty({ description: 'Minutes after midnight, clinic time' })
  @IsInt()
  @Min(0)
  @Max(1440)
  startsMinute!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(1440) endsMinute!: number;
}

class WeekDto {
  @ApiProperty({ type: [PeriodDto] })
  @IsArray()
  @ArrayMaxSize(PERIODS_MAX)
  @ValidateNested({ each: true })
  @Type(() => PeriodDto)
  weekly!: PeriodDto[];
  @ApiProperty({ type: [PeriodDto] })
  @IsArray()
  @ArrayMaxSize(PERIODS_MAX)
  @ValidateNested({ each: true })
  @Type(() => PeriodDto)
  breaks!: PeriodDto[];
}

class LeaveDto {
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Empty: every clinic',
  })
  @IsOptional()
  @IsUUID()
  clinicId?: string | null;
  @ApiProperty() @IsDateString({ strict: true }) startsAt!: string;
  @ApiProperty() @IsDateString({ strict: true }) endsAt!: string;
}

class BookingDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'Null: the default visit length setting',
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  visitMinutes!: number | null;
  @ApiProperty() @IsBoolean() bookable!: boolean;
  @ApiProperty() @IsBoolean() acceptingNewPatients!: boolean;
}

class ClinicHoursDto {
  @ApiProperty({
    type: [PeriodDto],
    description: 'Opening periods; weekday 0 = Sunday',
  })
  @IsArray()
  @ArrayMaxSize(PERIODS_MAX)
  @ValidateNested({ each: true })
  @Type(() => PeriodDto)
  periods!: PeriodDto[];
}

class ClinicLeaveDto {
  @ApiProperty() @IsDateString({ strict: true }) startsAt!: string;
  @ApiProperty() @IsDateString({ strict: true }) endsAt!: string;
}

class DoctorDetailsDto {
  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4100)
  biography?: string;
  @ApiPropertyOptional({ type: 'integer', minimum: 0, maximum: 80 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(80)
  yearsOfExperience?: number;
  @ApiPropertyOptional({
    enum: doctorLanguages,
    isArray: true,
    minItems: 1,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(doctorLanguages.length)
  @IsIn(doctorLanguages, { each: true })
  languages?: string[];
  @ApiPropertyOptional({
    type: 'integer',
    nullable: true,
    description: 'First-visit fee in IQD; null: the default fee setting.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  @Max(5_000_000)
  consultationFeeIqd?: number | null;
  @ApiPropertyOptional({
    type: 'integer',
    nullable: true,
    description: 'Follow-up fee in IQD; null: the first-visit fee.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  @Max(5_000_000)
  followUpFeeIqd?: number | null;
}

class ClinicDoctorParams {
  @ApiProperty({ format: 'uuid' }) @IsUUID() doctorId!: string;
}
class ClinicDoctorLeaveParams extends ClinicDoctorParams {
  @ApiProperty({ format: 'uuid' }) @IsUUID() leaveId!: string;
}

class ClinicParams {
  @ApiProperty({ format: 'uuid' }) @IsUUID() clinicId!: string;
}

class DoctorParams {
  @ApiProperty({ format: 'uuid' }) @IsUUID() id!: string;
}
class DoctorClinicParams extends DoctorParams {
  @ApiProperty({ format: 'uuid' }) @IsUUID() clinicId!: string;
}
class DoctorLeaveParams extends DoctorParams {
  @ApiProperty({ format: 'uuid' }) @IsUUID() leaveId!: string;
}

const requestId = (req: AuthenticatedRequest) => req.requestId ?? 'unavailable';

function owner(req: AuthenticatedRequest): HoursActor {
  if (
    !req.principal ||
    req.principal.kind !== 'platformAdministrator' ||
    req.tenant?.organizationId ||
    req.tenant?.clinicId
  )
    throw new ForbiddenException(
      'A global platform administrator session is required.',
    );
  return { id: req.principal.id, via: 'platform', requestId: requestId(req) };
}

/** A receptionist (their doctors only) or clinic manager at their clinic. */
function clinicScope(req: AuthenticatedRequest): ClinicScope {
  if (!req.principal || req.principal.kind !== 'staff')
    throw new ForbiddenException('A clinic staff session is required.');
  return {
    actorId: req.principal.id,
    organizationId: req.tenant?.organizationId,
    clinicId: req.tenant?.clinicId,
    doctorIds: req.tenant?.doctorIds,
    receptionist: req.principal.capabilities.has('reception:doctors:manage'),
    requestId: requestId(req),
  };
}

@ApiTags('platform')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireCapabilities('platform:administration')
@Controller('platform/doctors/:id')
export class DoctorHoursController {
  constructor(private readonly hours: DoctorHoursService) {}

  @Get('hours')
  @ApiOperation({
    summary: 'Working hours, breaks, time off and booking switches',
  })
  get(@Req() req: AuthenticatedRequest, @Param() params: DoctorParams) {
    owner(req);
    return this.hours.hours(params.id);
  }

  @Put('hours/:clinicId')
  @HttpCode(204)
  async week(
    @Req() req: AuthenticatedRequest,
    @Param() params: DoctorClinicParams,
    @Body() body: WeekDto,
  ) {
    await this.hours.setWeek(owner(req), params.id, params.clinicId, body);
  }

  @Post('leave')
  addLeave(
    @Req() req: AuthenticatedRequest,
    @Param() params: DoctorParams,
    @Body() body: LeaveDto,
  ) {
    return this.hours.addLeave(owner(req), params.id, {
      clinicId: body.clinicId ?? null,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
    });
  }

  @Delete('leave/:leaveId')
  @HttpCode(204)
  async removeLeave(
    @Req() req: AuthenticatedRequest,
    @Param() params: DoctorLeaveParams,
  ) {
    await this.hours.removeLeave(owner(req), params.id, params.leaveId);
  }

  @Put('booking')
  @HttpCode(204)
  async booking(
    @Req() req: AuthenticatedRequest,
    @Param() params: DoctorParams,
    @Body() body: BookingDto,
  ) {
    await this.hours.setBooking(owner(req), params.id, {
      visitMinutes: body.visitMinutes ?? null,
      bookable: body.bookable,
      acceptingNewPatients: body.acceptingNewPatients,
    });
  }
}

@ApiTags('platform')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireCapabilities('platform:administration')
@Controller('platform/clinics/:clinicId/hours')
export class ClinicHoursController {
  constructor(private readonly hours: DoctorHoursService) {}

  @Get()
  @ApiOperation({ summary: "A clinic's opening hours and its doctors' hours" })
  get(@Req() req: AuthenticatedRequest, @Param() params: ClinicParams) {
    owner(req);
    return this.hours.clinicHours(params.clinicId);
  }

  @Put()
  @HttpCode(204)
  async set(
    @Req() req: AuthenticatedRequest,
    @Param() params: ClinicParams,
    @Body() body: ClinicHoursDto,
  ) {
    await this.hours.setClinicHours(owner(req), params.clinicId, body.periods);
  }
}

/**
 * Clinic Portal → Doctors → a doctor. Reception controls everything about
 * the doctors they work for (founder decision 2026-11-19): hours, breaks,
 * time off at this clinic, visit length, app booking, fees and profile.
 * The doctor's name, specialties and active status stay with Saxlem.
 */
@ApiTags('clinic doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireCapabilities('doctor:settings:manage')
@Controller('clinic/doctors/:doctorId')
export class ClinicDoctorSettingsController {
  constructor(private readonly hours: DoctorHoursService) {}

  @Get('settings')
  @ApiOperation({
    summary: "A doctor's hours, time off, booking, fees and profile here",
  })
  get(@Req() req: AuthenticatedRequest, @Param() params: ClinicDoctorParams) {
    return this.hours.clinicView(clinicScope(req), params.doctorId);
  }

  @Put('hours')
  @HttpCode(204)
  @ApiOperation({ summary: "Replace the doctor's week at this clinic" })
  async week(
    @Req() req: AuthenticatedRequest,
    @Param() params: ClinicDoctorParams,
    @Body() body: WeekDto,
  ) {
    const actor = await this.hours.clinicDoctor(
      clinicScope(req),
      params.doctorId,
    );
    await this.hours.setWeek(actor, params.doctorId, actor.clinicId, body);
  }

  @Post('leave')
  @ApiOperation({ summary: 'Add time off at this clinic' })
  async addLeave(
    @Req() req: AuthenticatedRequest,
    @Param() params: ClinicDoctorParams,
    @Body() body: ClinicLeaveDto,
  ) {
    const actor = await this.hours.clinicDoctor(
      clinicScope(req),
      params.doctorId,
    );
    return this.hours.addLeave(actor, params.doctorId, {
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
    });
  }

  @Delete('leave/:leaveId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove time off at this clinic' })
  async removeLeave(
    @Req() req: AuthenticatedRequest,
    @Param() params: ClinicDoctorLeaveParams,
  ) {
    const actor = await this.hours.clinicDoctor(
      clinicScope(req),
      params.doctorId,
    );
    await this.hours.removeLeave(actor, params.doctorId, params.leaveId);
  }

  @Put('booking')
  @HttpCode(204)
  @ApiOperation({ summary: 'Visit length and app booking switches' })
  async booking(
    @Req() req: AuthenticatedRequest,
    @Param() params: ClinicDoctorParams,
    @Body() body: BookingDto,
  ) {
    const actor = await this.hours.clinicDoctor(
      clinicScope(req),
      params.doctorId,
    );
    await this.hours.setBooking(actor, params.doctorId, {
      visitMinutes: body.visitMinutes ?? null,
      bookable: body.bookable,
      acceptingNewPatients: body.acceptingNewPatients,
    });
  }

  @Put('details')
  @HttpCode(204)
  @ApiOperation({ summary: 'Fees, biography, languages, experience' })
  async details(
    @Req() req: AuthenticatedRequest,
    @Param() params: ClinicDoctorParams,
    @Body() body: DoctorDetailsDto,
  ) {
    const actor = await this.hours.clinicDoctor(
      clinicScope(req),
      params.doctorId,
    );
    await this.hours.setDetails(actor, params.doctorId, body);
  }
}

/** Clinic Portal: the signed-in clinic's opening hours. */
@ApiTags('clinic doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireCapabilities('clinic:hours:manage')
@Controller('clinic/opening-hours')
export class ClinicOpeningHoursController {
  constructor(private readonly hours: DoctorHoursService) {}

  @Get()
  @ApiOperation({ summary: "This clinic's opening hours and doctors' hours" })
  get(@Req() req: AuthenticatedRequest) {
    return this.hours.clinicHours(
      this.hours.clinicActor(clinicScope(req)).clinicId,
    );
  }

  @Put()
  @HttpCode(204)
  @ApiOperation({ summary: "Replace this clinic's opening hours" })
  async set(@Req() req: AuthenticatedRequest, @Body() body: ClinicHoursDto) {
    const actor = this.hours.clinicActor(clinicScope(req));
    await this.hours.setClinicHours(actor, actor.clinicId, body.periods);
  }
}
