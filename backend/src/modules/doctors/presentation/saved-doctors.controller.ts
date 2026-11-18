import {
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
  ConflictException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../../identity/presentation/require-capabilities.decorator';
import { DoctorService } from '../application/doctor.service';
import { DoctorDtoMapper } from './doctor-dto.mapper';
import { DoctorDetailResponseDto } from './doctor.dto';

/** A patient can keep this many doctors. */
export const SAVED_DOCTORS_MAX = 100;

class SavedDoctorParamsDto {
  @IsUUID('all') doctorId!: string;
}

class SavedDoctorsResponseDto {
  @ApiProperty({ type: DoctorDetailResponseDto, isArray: true })
  items!: DoctorDetailResponseDto[];
}

/** "Saved doctors": kept per app account, shared by its family profiles. */
@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireCapabilities('patient:self')
@Controller('patients/me/saved-doctors')
export class SavedDoctorsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctors: DoctorService,
    private readonly mapper: DoctorDtoMapper,
  ) {}

  @Get()
  @ApiOperation({ summary: 'My saved doctors, newest first' })
  @ApiOkResponse({ type: SavedDoctorsResponseDto })
  async list(
    @Req() req: AuthenticatedRequest,
  ): Promise<SavedDoctorsResponseDto> {
    const account = await this.account(req);
    const saved = await this.prisma.db.savedDoctor.findMany({
      where: { patientAccountId: account },
      orderBy: { createdAt: 'desc' },
      take: SAVED_DOCTORS_MAX,
    });
    const items = await Promise.all(
      saved.map((row) =>
        this.doctors
          .get(this.access(req), row.doctorId, req.requestId ?? '', 'details')
          .then((doctor) => this.mapper.detail(doctor))
          // A doctor who stopped working with Saxlem drops out of the list.
          .catch(() => null),
      ),
    );
    return { items: items.filter((item) => item !== null) };
  }

  @Post(':doctorId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Save a doctor (again is fine)' })
  @ApiNoContentResponse()
  async save(
    @Req() req: AuthenticatedRequest,
    @Param() params: SavedDoctorParamsDto,
  ): Promise<void> {
    const account = await this.account(req);
    // Only doctors the patient can see can be saved.
    await this.doctors
      .get(this.access(req), params.doctorId, req.requestId ?? '', 'details')
      .catch(() => {
        throw new NotFoundException('Doctor was not found.');
      });
    const count = await this.prisma.db.savedDoctor.count({
      where: { patientAccountId: account },
    });
    if (count >= SAVED_DOCTORS_MAX)
      throw new ConflictException('You have saved the most doctors allowed.');
    await this.prisma.db.savedDoctor.upsert({
      where: {
        patientAccountId_doctorId: {
          patientAccountId: account,
          doctorId: params.doctorId,
        },
      },
      create: { patientAccountId: account, doctorId: params.doctorId },
      update: {},
    });
  }

  @Delete(':doctorId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a saved doctor (already gone is fine)' })
  @ApiNoContentResponse()
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param() params: SavedDoctorParamsDto,
  ): Promise<void> {
    const account = await this.account(req);
    await this.prisma.db.savedDoctor.deleteMany({
      where: { patientAccountId: account, doctorId: params.doctorId },
    });
  }

  private async account(req: AuthenticatedRequest): Promise<string> {
    if (req.principal?.kind !== 'patient')
      throw new NotFoundException('Patient account was not found.');
    const account = await this.prisma.db.patientAccount.findUnique({
      where: { userId: req.principal.id },
      select: { id: true },
    });
    if (!account) throw new NotFoundException('Patient account was not found.');
    return account.id;
  }

  private access(req: AuthenticatedRequest) {
    return {
      actorId: req.principal!.id,
      patient: true,
      platformAdministrator: false,
      doctor: false,
      organizationId: req.tenant?.organizationId,
      clinicId: req.tenant?.clinicId,
    };
  }
}
