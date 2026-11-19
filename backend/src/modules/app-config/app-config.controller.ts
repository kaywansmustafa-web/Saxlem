import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../identity/presentation/require-capabilities.decorator';
import {
  AppConfigResponseDto,
  CreateConcernDto,
  CreateSpecialtyDto,
  DoctorSpecialtiesDto,
  IdParamsDto,
  ReorderDto,
  UpdateConcernDto,
  UpdateSettingsDto,
  UpdateSpecialtyDto,
} from './app-config.dto';
import { AppSettings } from './app-settings.service';
import { CatalogService } from './catalog.service';

/** Public: no sign-in, no personal data. The app reads it at start. */
@ApiTags('app')
@Controller('app')
export class AppConfigController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly settings: AppSettings,
  ) {}

  @Get('config')
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({
    summary: 'Specialties, Home tiles and public settings for the app',
  })
  @ApiOkResponse({ type: AppConfigResponseDto })
  async config(): Promise<AppConfigResponseDto> {
    return {
      ...(await this.catalog.appCatalog()),
      settings: this.settings.publicValues(),
    };
  }
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
@Controller('platform')
export class PlatformCatalogController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly settings: AppSettings,
  ) {}

  @Get('catalog/specialties')
  @ApiOperation({ summary: 'Every specialty, with doctors and tiles' })
  specialties(@Req() req: AuthenticatedRequest) {
    owner(req);
    return this.catalog.platformSpecialties();
  }

  @Post('catalog/specialties')
  createSpecialty(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateSpecialtyDto,
  ) {
    return this.catalog.createSpecialty(owner(req), body, requestId(req));
  }

  @Put('catalog/specialties/order')
  @HttpCode(204)
  async reorderSpecialties(
    @Req() req: AuthenticatedRequest,
    @Body() body: ReorderDto,
  ) {
    await this.catalog.reorderSpecialties(owner(req), body.ids, requestId(req));
  }

  @Patch('catalog/specialties/:id')
  @HttpCode(204)
  async updateSpecialty(
    @Req() req: AuthenticatedRequest,
    @Param() params: IdParamsDto,
    @Body() body: UpdateSpecialtyDto,
  ) {
    await this.catalog.updateSpecialty(
      owner(req),
      params.id,
      body,
      requestId(req),
    );
  }

  @Get('catalog/concerns')
  @ApiOperation({ summary: 'Every "What\'s bothering you?" tile' })
  concerns(@Req() req: AuthenticatedRequest) {
    owner(req);
    return this.catalog.platformConcerns();
  }

  @Post('catalog/concerns')
  createConcern(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateConcernDto,
  ) {
    return this.catalog.createConcern(owner(req), body, requestId(req));
  }

  @Put('catalog/concerns/order')
  @HttpCode(204)
  async reorderConcerns(
    @Req() req: AuthenticatedRequest,
    @Body() body: ReorderDto,
  ) {
    await this.catalog.reorderConcerns(owner(req), body.ids, requestId(req));
  }

  @Patch('catalog/concerns/:id')
  @HttpCode(204)
  async updateConcern(
    @Req() req: AuthenticatedRequest,
    @Param() params: IdParamsDto,
    @Body() body: UpdateConcernDto,
  ) {
    await this.catalog.updateConcern(
      owner(req),
      params.id,
      body,
      requestId(req),
    );
  }

  @Delete('catalog/concerns/:id')
  @HttpCode(204)
  async deleteConcern(
    @Req() req: AuthenticatedRequest,
    @Param() params: IdParamsDto,
  ) {
    await this.catalog.deleteConcern(owner(req), params.id, requestId(req));
  }

  @Put('doctors/:id/specialties')
  @HttpCode(204)
  async doctorSpecialties(
    @Req() req: AuthenticatedRequest,
    @Param() params: IdParamsDto,
    @Body() body: DoctorSpecialtiesDto,
  ) {
    await this.catalog.setDoctorSpecialties(
      owner(req),
      params.id,
      body.specialtyIds,
      body.primarySpecialtyId,
      requestId(req),
    );
  }

  @Get('app-settings')
  @ApiOperation({ summary: 'Every app setting with its default and limits' })
  appSettings(@Req() req: AuthenticatedRequest) {
    owner(req);
    return this.settings.describe();
  }

  @Put('app-settings')
  @HttpCode(204)
  async updateAppSettings(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateSettingsDto,
  ) {
    await this.settings.update(owner(req), body.changes, requestId(req));
  }
}
