import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from '../doctors/presentation/doctor.dto';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../identity/presentation/jwt-auth.guard';
import { RequireCapabilities } from '../identity/presentation/require-capabilities.decorator';
import {
  AppointmentReviewResponseDto,
  DoctorReviewPageDto,
  MyReviewDto,
  PlatformReviewPageDto,
  PlatformReviewQueryDto,
  ReviewAppointmentParamsDto,
  ReviewDoctorParamsDto,
  ReviewIdParamsDto,
  ReviewListQueryDto,
  SetReviewStatusDto,
  WriteReviewDto,
} from './review.dto';
import { ReviewService } from './review.service';

function principal(req: AuthenticatedRequest) {
  if (!req.principal)
    throw new Error('Authentication guard invariant is broken.');
  return req.principal;
}

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments/:id/review')
export class AppointmentReviewController {
  constructor(private readonly reviews: ReviewService) {}

  @Get()
  @RequireCapabilities('patient:self')
  @ApiOperation({ summary: 'Can I rate this visit, and my rating (patients)' })
  @ApiOkResponse({ type: AppointmentReviewResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  get(
    @Req() req: AuthenticatedRequest,
    @Param() params: ReviewAppointmentParamsDto,
  ): Promise<AppointmentReviewResponseDto> {
    const who = principal(req);
    ReviewService.patientOnly(who.kind);
    return this.reviews.forAppointment(who.id, params.id);
  }

  @Post()
  @HttpCode(200)
  @RequireCapabilities('patient:self')
  @ApiOperation({
    summary: 'Rate a visit that took place (patients)',
    description:
      'One review per completed visit, written or changed within 30 days. Comments: up to 500 characters, no links, emails or phone numbers.',
  })
  @ApiOkResponse({ type: MyReviewDto })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  write(
    @Req() req: AuthenticatedRequest,
    @Param() params: ReviewAppointmentParamsDto,
    @Body() body: WriteReviewDto,
  ): Promise<MyReviewDto> {
    const who = principal(req);
    ReviewService.patientOnly(who.kind);
    return this.reviews.write(who.id, params.id, body);
  }
}

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireCapabilities('doctor:directory:read')
@Controller('doctors/:id/reviews')
export class DoctorReviewsController {
  constructor(private readonly reviews: ReviewService) {}

  @Get()
  @ApiOperation({ summary: "A doctor's verified reviews, newest first" })
  @ApiOkResponse({ type: DoctorReviewPageDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  list(
    @Param() params: ReviewDoctorParamsDto,
    @Query() query: ReviewListQueryDto,
  ): Promise<DoctorReviewPageDto> {
    return this.reviews.doctorReviews(
      params.id,
      query.cursor,
      query.pageSize ?? 20,
    );
  }
}

@ApiTags('platform')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireCapabilities('platform:administration')
@Controller('platform/reviews')
export class PlatformReviewsController {
  constructor(private readonly reviews: ReviewService) {}

  @Get()
  @ApiOperation({ summary: 'All reviews, for moderation' })
  @ApiOkResponse({ type: PlatformReviewPageDto })
  list(@Query() query: PlatformReviewQueryDto): Promise<PlatformReviewPageDto> {
    return this.reviews.platformReviews(
      query.status,
      query.cursor,
      query.pageSize ?? 20,
    );
  }

  @Put(':reviewId/status')
  @HttpCode(204)
  @ApiOperation({ summary: 'Hide or show a review' })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  async setStatus(
    @Req() req: AuthenticatedRequest,
    @Param() params: ReviewIdParamsDto,
    @Body() body: SetReviewStatusDto,
  ): Promise<void> {
    await this.reviews.setStatus(
      principal(req).id,
      params.reviewId,
      body.status,
      req.requestId ?? 'unavailable',
    );
  }
}
