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
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../identity/presentation/require-capabilities.decorator';
import { DoctorHoursService } from './doctor-hours.service';
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

function owner(req: AuthenticatedRequest): string {
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
const requestId = (req: AuthenticatedRequest) => req.requestId ?? 'unavailable';

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
    await this.hours.setWeek(
      owner(req),
      params.id,
      params.clinicId,
      body,
      requestId(req),
    );
  }

  @Post('leave')
  addLeave(
    @Req() req: AuthenticatedRequest,
    @Param() params: DoctorParams,
    @Body() body: LeaveDto,
  ) {
    return this.hours.addLeave(
      owner(req),
      params.id,
      {
        clinicId: body.clinicId ?? null,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
      },
      requestId(req),
    );
  }

  @Delete('leave/:leaveId')
  @HttpCode(204)
  async removeLeave(
    @Req() req: AuthenticatedRequest,
    @Param() params: DoctorLeaveParams,
  ) {
    await this.hours.removeLeave(
      owner(req),
      params.id,
      params.leaveId,
      requestId(req),
    );
  }

  @Put('booking')
  @HttpCode(204)
  async booking(
    @Req() req: AuthenticatedRequest,
    @Param() params: DoctorParams,
    @Body() body: BookingDto,
  ) {
    await this.hours.setBooking(
      owner(req),
      params.id,
      {
        visitMinutes: body.visitMinutes ?? null,
        bookable: body.bookable,
        acceptingNewPatients: body.acceptingNewPatients,
      },
      requestId(req),
    );
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
    await this.hours.setClinicHours(
      owner(req),
      params.clinicId,
      body.periods,
      requestId(req),
    );
  }
}
