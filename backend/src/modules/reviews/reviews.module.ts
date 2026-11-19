import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import {
  AppointmentReviewController,
  DoctorReviewsController,
  PlatformReviewsController,
} from './reviews.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [IdentityModule],
  controllers: [
    AppointmentReviewController,
    DoctorReviewsController,
    PlatformReviewsController,
  ],
  providers: [ReviewService],
})
export class ReviewsModule {}
