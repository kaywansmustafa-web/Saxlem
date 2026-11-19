import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  authorName,
  averageOf,
  cleanComment,
  REVIEW_WINDOW_DAYS,
} from './review-rules';
import type {
  AppointmentReviewResponseDto,
  DoctorReviewPageDto,
  MyReviewDto,
  PlatformReviewPageDto,
  WriteReviewDto,
} from './review.dto';

const DAY = 86_400_000;

interface Cursor {
  readonly at: Date;
  readonly id: string;
}
const encode = (row: { createdAt: Date; id: string }) =>
  Buffer.from(`${row.createdAt.toISOString()}|${row.id}`).toString('base64url');
function decode(cursor?: string): Cursor | null {
  if (!cursor) return null;
  const [at, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  const date = new Date(at ?? '');
  if (Number.isNaN(date.getTime()) || !/^[0-9a-f-]{36}$/i.test(id ?? ''))
    throw new BadRequestException('Cursor is not valid.');
  return { at: date, id: id! };
}
const after = (cursor: Cursor | null): Prisma.DoctorReviewWhereInput =>
  cursor
    ? {
        OR: [
          { createdAt: { lt: cursor.at } },
          { createdAt: cursor.at, id: { lt: cursor.id } },
        ],
      }
    : {};

/**
 * Verified reviews: only the patient who had the visit can rate it, once,
 * within 30 days. Published totals per doctor are kept beside the reviews.
 */
@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  /** The patient's view of one visit: can they rate it, and their rating. */
  async forAppointment(
    userId: string,
    appointmentId: string,
    now = new Date(),
  ): Promise<AppointmentReviewResponseDto> {
    const visit = await this.ownVisit(userId, appointmentId);
    const until = new Date(visit.endsAt.getTime() + REVIEW_WINDOW_DAYS * DAY);
    const open = visit.status === 'completed' && now <= until;
    return {
      canReview: open,
      reviewableUntil:
        visit.status === 'completed' ? until.toISOString() : null,
      review: visit.review ? this.mine(visit.review) : null,
    };
  }

  async write(
    userId: string,
    appointmentId: string,
    input: WriteReviewDto,
    now = new Date(),
  ): Promise<MyReviewDto> {
    const visit = await this.ownVisit(userId, appointmentId);
    if (visit.status !== 'completed')
      throw new ConflictException('Only a visit that took place can be rated.');
    if (now.getTime() > visit.endsAt.getTime() + REVIEW_WINDOW_DAYS * DAY)
      throw new ConflictException('Reviews close 30 days after the visit.');
    if (visit.review?.status === 'hidden')
      throw new ConflictException('This review was removed by Saxlem.');
    let comment: string | null;
    try {
      comment = cleanComment(input.comment);
    } catch {
      throw new BadRequestException(
        'Comments are up to 500 characters, without links, emails or phone numbers.',
      );
    }
    const profile = visit.patientRegistration.patientProfile;
    const data = {
      rating: input.rating,
      comment,
      anonymous: input.anonymous,
      authorName: authorName(profile.firstName, profile.lastName),
    };
    const review = await this.prisma.db.$transaction(async (tx) => {
      await this.lock(tx, visit.doctorId);
      const saved = await tx.doctorReview.upsert({
        where: { appointmentId: visit.id },
        create: {
          organizationId: visit.organizationId,
          clinicId: visit.clinicId,
          doctorId: visit.doctorId,
          appointmentId: visit.id,
          patientProfileId: visit.patientProfileId,
          ...data,
        },
        update: data,
      });
      await this.restat(tx, visit.doctorId);
      return saved;
    });
    return this.mine(review);
  }

  /** Published reviews of an active doctor, newest first. */
  async doctorReviews(
    doctorId: string,
    cursor?: string,
    pageSize = 20,
  ): Promise<DoctorReviewPageDto> {
    const doctor = await this.prisma.db.doctor.findFirst({
      where: { id: doctorId, status: 'active' },
      select: { id: true },
    });
    if (!doctor) throw new NotFoundException('Doctor was not found.');
    const where: Prisma.DoctorReviewWhereInput = {
      doctorId,
      status: 'published',
    };
    const [rows, groups] = await Promise.all([
      this.prisma.db.doctorReview.findMany({
        where: { ...where, ...after(decode(cursor)) },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: pageSize + 1,
      }),
      this.prisma.db.doctorReview.groupBy({
        by: ['rating'],
        where,
        _count: { _all: true },
      }),
    ]);
    const distribution = [1, 2, 3, 4, 5].map(
      (stars) =>
        groups.find((group) => group.rating === stars)?._count._all ?? 0,
    );
    const count = distribution.reduce((sum, n) => sum + n, 0);
    const sum = distribution.reduce((total, n, i) => total + n * (i + 1), 0);
    const page = rows.slice(0, pageSize);
    return {
      summary: { average: averageOf(count, sum), count, distribution },
      items: page.map((row) => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        author: row.anonymous ? null : row.authorName,
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor:
        rows.length > pageSize ? encode(page[page.length - 1]!) : null,
    };
  }

  /** Every review, for Saxlem to moderate. */
  async platformReviews(
    status: 'published' | 'hidden' | undefined,
    cursor?: string,
    pageSize = 20,
  ): Promise<PlatformReviewPageDto> {
    const rows = await this.prisma.db.doctorReview.findMany({
      where: { ...(status ? { status } : {}), ...after(decode(cursor)) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      include: {
        appointment: {
          select: {
            publicReference: true,
            clinic: { select: { name: true } },
            doctorAssignment: {
              select: { doctor: { select: { displayName: true } } },
            },
          },
        },
      },
    });
    const page = rows.slice(0, pageSize);
    return {
      items: page.map((row) => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        author: row.anonymous ? null : row.authorName,
        authorName: row.authorName,
        anonymous: row.anonymous,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        doctorId: row.doctorId,
        doctorName: row.appointment.doctorAssignment.doctor.displayName,
        clinicName: row.appointment.clinic.name,
        appointmentReference: row.appointment.publicReference,
      })),
      nextCursor:
        rows.length > pageSize ? encode(page[page.length - 1]!) : null,
    };
  }

  async setStatus(
    actorId: string,
    reviewId: string,
    status: 'published' | 'hidden',
    requestId: string,
  ): Promise<void> {
    await this.prisma.db.$transaction(async (tx) => {
      const review = await tx.doctorReview.findUnique({
        where: { id: reviewId },
        select: { doctorId: true, status: true },
      });
      if (!review) throw new NotFoundException('Review was not found.');
      await this.lock(tx, review.doctorId);
      await tx.doctorReview.update({
        where: { id: reviewId },
        data: { status },
      });
      await this.restat(tx, review.doctorId);
      await tx.auditEvent.create({
        data: {
          actorUserId: actorId,
          action:
            status === 'hidden'
              ? 'platform.review.hidden'
              : 'platform.review.published',
          targetType: 'DoctorReview',
          targetId: reviewId,
          outcome: 'succeeded',
          requestId,
          occurredAt: new Date(),
        },
      });
    });
  }

  private async ownVisit(userId: string, appointmentId: string) {
    const visit = await this.prisma.db.appointment.findFirst({
      where: {
        id: appointmentId,
        patientRegistration: {
          patientProfile: { patientAccount: { userId } },
        },
      },
      include: {
        review: true,
        patientRegistration: {
          select: {
            patientProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!visit) throw new NotFoundException('Appointment was not found.');
    return visit;
  }

  private mine(review: {
    id: string;
    rating: number;
    comment: string | null;
    anonymous: boolean;
    status: 'published' | 'hidden';
    createdAt: Date;
    updatedAt: Date;
  }): MyReviewDto {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      anonymous: review.anonymous,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }

  private lock(tx: Prisma.TransactionClient, doctorId: string) {
    return tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`reviews:${doctorId}`}, 0))`;
  }

  private restat(tx: Prisma.TransactionClient, doctorId: string) {
    return tx.$executeRaw`
      INSERT INTO "doctor_review_stats" ("doctor_id", "review_count", "review_sum", "updated_at")
      SELECT ${doctorId}::uuid, count(*)::int, coalesce(sum("rating"), 0)::int, now()
      FROM "doctor_reviews"
      WHERE "doctor_id" = ${doctorId}::uuid AND "status" = 'published'
      ON CONFLICT ("doctor_id") DO UPDATE SET
        "review_count" = EXCLUDED."review_count",
        "review_sum" = EXCLUDED."review_sum",
        "updated_at" = EXCLUDED."updated_at"`;
  }

  /** Staff and platform principals never write reviews. */
  static patientOnly(kind: string): void {
    if (kind !== 'patient')
      throw new ForbiddenException('Only patients review their visits.');
  }
}
