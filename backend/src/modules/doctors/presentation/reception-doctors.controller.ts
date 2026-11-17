import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import {
  MAX_RECEPTION_DOCTORS,
  ReceptionDoctorsService,
  type ReceptionAccess,
} from '../application/reception-doctors.service';
import { ApiErrorEnvelopeDto } from './doctor.dto';

export class ReceptionDoctorDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ description: 'This receptionist works for the doctor.' })
  assigned!: boolean;
}
export class ReceptionDoctorsResponseDto {
  @ApiProperty({ type: ReceptionDoctorDto, isArray: true })
  doctors!: ReceptionDoctorDto[];
  @ApiProperty({
    description: 'False until the receptionist has chosen a doctor.',
  })
  configured!: boolean;
}
export class UpdateReceptionDoctorsDto {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    isArray: true,
    minItems: 1,
    maxItems: MAX_RECEPTION_DOCTORS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_RECEPTION_DOCTORS)
  @IsUUID('all', { each: true })
  doctorIds!: string[];
}

@ApiTags('reception')
@ApiBearerAuth()
@ApiForbiddenResponse({ type: ApiErrorEnvelopeDto })
@UseGuards(JwtAuthGuard)
@RequireCapabilities('reception:doctors:manage')
@Controller('reception')
export class ReceptionDoctorsController {
  constructor(private readonly service: ReceptionDoctorsService) {}

  @Get('doctors')
  @ApiOperation({
    summary: "The signed-in receptionist's doctors at this clinic",
    description:
      'Every active doctor at the clinic, marked whether this receptionist works for them. A receptionist starts with one doctor and can add more.',
  })
  @ApiOkResponse({ type: ReceptionDoctorsResponseDto })
  view(@Req() request: AuthenticatedRequest) {
    return this.service.view(this.access(request));
  }

  @Put('doctors')
  @ApiOperation({ summary: 'Choose which doctors this receptionist works for' })
  @ApiOkResponse({ type: ReceptionDoctorsResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
  update(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateReceptionDoctorsDto,
  ) {
    return this.service.update(
      this.access(request),
      body.doctorIds,
      request.requestId,
    );
  }

  private access(request: AuthenticatedRequest): ReceptionAccess {
    if (!request.principal)
      throw new Error('Authentication guard invariant is broken.');
    return {
      actorId: request.principal.id,
      organizationId: request.tenant?.organizationId,
      clinicId: request.tenant?.clinicId,
      receptionist: request.principal.capabilities.has(
        'reception:doctors:manage',
      ),
    };
  }
}
