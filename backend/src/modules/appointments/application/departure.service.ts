import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { AppointmentAccess } from '../domain/appointment';
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../domain/appointment.repository';
import type { LatLng, RouteTime } from '../infrastructure/route-time';

export const ROUTE_TIME = Symbol('ROUTE_TIME');

/** Minutes to park and walk in. */
export const PARK_AND_WALK_MINUTES = 5;
/** Arrive this early to check in: longer for a first visit (registration). */
export const CHECK_IN_MINUTES = { initial: 10, followUp: 5 } as const;

export interface DeparturePlan {
  readonly leaveAt: Date;
  readonly arriveBy: Date;
  readonly travelSeconds: number;
  readonly distanceMeters: number;
  readonly source: RouteTime['source'];
  readonly computedAt: Date;
}

/**
 * When a patient should leave for their visit. Their position is used only
 * for this calculation: it is never stored or logged.
 */
@Injectable()
export class DepartureService {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointments: AppointmentRepository,
    private readonly prisma: PrismaService,
    @Inject(ROUTE_TIME)
    private readonly routes: {
      drive(a: LatLng, b: LatLng, at: Date): Promise<RouteTime>;
    },
  ) {}

  async plan(
    access: AppointmentAccess,
    appointmentId: string,
    origin: LatLng,
    now = new Date(),
  ): Promise<DeparturePlan> {
    if (!access.patient)
      throw new ForbiddenException('Only patients plan their own trip.');
    if (
      !Number.isFinite(origin.latitude) ||
      !Number.isFinite(origin.longitude) ||
      Math.abs(origin.latitude) > 90 ||
      Math.abs(origin.longitude) > 180
    )
      throw new BadRequestException('Location is not valid.');
    const appointment = await this.appointments.get(access, appointmentId);
    if (!appointment) throw new NotFoundException('Appointment was not found.');
    if (
      appointment.status !== 'scheduled' &&
      appointment.status !== 'confirmed'
    )
      throw new ConflictException('This visit is not coming up.');
    const clinic = await this.prisma.db.clinic.findUnique({
      where: { id: appointment.clinicId },
      select: { latitude: true, longitude: true },
    });
    if (clinic?.latitude == null || clinic.longitude == null)
      throw new ConflictException(
        "The clinic hasn't added its map location yet.",
      );
    const destination = {
      latitude: clinic.latitude,
      longitude: clinic.longitude,
    };
    const arriveBy = new Date(
      new Date(appointment.startsAt).getTime() -
        CHECK_IN_MINUTES[appointment.type] * 60_000,
    );
    const leaveFor = (route: RouteTime) =>
      new Date(
        arriveBy.getTime() -
          route.seconds * 1000 -
          PARK_AND_WALK_MINUTES * 60_000,
      );
    // First with traffic now, then with the traffic expected when they
    // actually set off (Google predicts it), if that is later.
    let route = await this.routes.drive(origin, destination, now);
    let leaveAt = leaveFor(route);
    if (
      route.source === 'traffic' &&
      leaveAt.getTime() > now.getTime() + 10 * 60_000
    ) {
      route = await this.routes.drive(origin, destination, leaveAt);
      leaveAt = leaveFor(route);
    }
    return Object.freeze({
      leaveAt,
      arriveBy,
      travelSeconds: route.seconds,
      distanceMeters: route.meters,
      source: route.source,
      computedAt: now,
    });
  }
}
