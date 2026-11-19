import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  BASIS_CODE,
  clinicHour,
  distanceBand,
  learnedFactor,
  observedRatio,
  type TripBasis,
} from './trip-learning';

export interface TripClinic {
  readonly id: string;
  readonly city: string | null;
  readonly timezone: string;
}

/**
 * Turns finished trips into anonymous drive-time corrections and reads them
 * back. Finished trips are collected lazily (at most once a minute) when a
 * correction is needed, so no extra worker runs.
 */
@Injectable()
export class TripLearningService {
  private readonly logger = new Logger(TripLearningService.name);
  private lastCollect = 0;

  constructor(private readonly prisma: PrismaService) {}

  async factor(
    clinic: TripClinic,
    basis: TripBasis,
    meters: number,
    at: Date,
    now = new Date(),
  ): Promise<{ factor: number; trips: number }> {
    if (now.getTime() - this.lastCollect > 60_000) {
      this.lastCollect = now.getTime();
      await this.collect(now).catch(() =>
        this.logger.warn({ outcomeCode: 'TRIP_LEARNING_COLLECT_FAILED' }),
      );
    }
    const { dayKind, hour } = clinicHour(at, clinic.timezone);
    const band = distanceBand(meters);
    const rows = await this.prisma.db.$queryRaw<
      { clinic_id: string; distance_band: number; trips: number; sum: number }[]
    >`
      SELECT l."clinic_id", l."distance_band", l."trips", l."sum_log_ratio" AS "sum"
      FROM "drive_time_learning" l
      JOIN "clinics" c ON c."id" = l."clinic_id"
      WHERE l."basis" = ${BASIS_CODE[basis]}
        AND l."day_kind" = ${dayKind}
        AND l."hour" = ${hour}
        AND ${
          clinic.city
            ? Prisma.sql`lower(c."city") = lower(${clinic.city})`
            : Prisma.sql`l."clinic_id" = ${clinic.id}::uuid`
        }`;
    const total = (match: (row: (typeof rows)[number]) => boolean) =>
      rows.filter(match).reduce(
        (sum, row) => ({
          trips: sum.trips + Number(row.trips),
          sumLogRatio: sum.sumLogRatio + Number(row.sum),
        }),
        { trips: 0, sumLogRatio: 0 },
      );
    return learnedFactor([
      total(() => true),
      total((row) => Number(row.distance_band) === band),
      total(
        (row) =>
          row.clinic_id === clinic.id && Number(row.distance_band) === band,
      ),
    ]);
  }

  /**
   * Folds trips whose patient has checked in into the totals and deletes
   * them; deletes trips that never ended in a check-in after a day.
   */
  async collect(now = new Date()): Promise<number> {
    return this.prisma.db.$transaction(async (tx) => {
      const done = await tx.$queryRaw<
        {
          organization_id: string;
          clinic_id: string;
          started_at: Date;
          arrived_at: Date;
          route_seconds: number;
          distance_band: number;
          basis: number;
          timezone: string;
        }[]
      >`
        WITH due AS (
          SELECT t."appointment_id", t."organization_id", t."clinic_id",
                 t."started_at", t."route_seconds", t."distance_band",
                 t."basis", r."arrived_at", c."timezone"
          FROM "appointment_trips" t
          JOIN "appointment_arrivals" r ON r."appointment_id" = t."appointment_id"
          JOIN "clinics" c ON c."id" = t."clinic_id"
          WHERE r."arrived_at" IS NOT NULL
          ORDER BY t."started_at"
          LIMIT 200
          FOR UPDATE OF t SKIP LOCKED
        ), gone AS (
          DELETE FROM "appointment_trips" t USING due
          WHERE t."appointment_id" = due."appointment_id"
          RETURNING t."appointment_id"
        )
        SELECT due."organization_id", due."clinic_id", due."started_at",
               due."arrived_at", due."route_seconds", due."distance_band",
               due."basis", due."timezone"
        FROM due JOIN gone USING ("appointment_id")`;
      let learned = 0;
      for (const trip of done) {
        const ratio = observedRatio(
          trip.started_at,
          trip.arrived_at,
          Number(trip.route_seconds),
        );
        if (ratio === null) continue;
        const { dayKind, hour } = clinicHour(trip.started_at, trip.timezone);
        await tx.$executeRaw`
          INSERT INTO "drive_time_learning"
            ("organization_id", "clinic_id", "basis", "distance_band",
             "day_kind", "hour", "trips", "sum_log_ratio", "updated_at")
          VALUES (${trip.organization_id}::uuid, ${trip.clinic_id}::uuid,
                  ${Number(trip.basis)}, ${Number(trip.distance_band)},
                  ${dayKind}, ${hour}, 1, ${Math.log(ratio)}, ${now})
          ON CONFLICT ("clinic_id", "basis", "distance_band", "day_kind", "hour")
          DO UPDATE SET
            "trips" = "drive_time_learning"."trips" + 1,
            "sum_log_ratio" = "drive_time_learning"."sum_log_ratio" + EXCLUDED."sum_log_ratio",
            "updated_at" = EXCLUDED."updated_at"`;
        learned += 1;
      }
      await tx.$executeRaw`
        DELETE FROM "appointment_trips" t
        USING "appointments" a
        WHERE a."id" = t."appointment_id"
          AND a."starts_at" < ${new Date(now.getTime() - 24 * 3_600_000)}`;
      return learned;
    });
  }
}
