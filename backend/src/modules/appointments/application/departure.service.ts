import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { AppSettings } from '../../app-config/app-settings.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { AppointmentAccess } from '../domain/appointment';
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../domain/appointment.repository';
import type { LatLng, RouteTime } from '../infrastructure/route-time';
import { BASIS_CODE, distanceBand, MIN_TRIPS } from './trip-learning';
import { TripLearningService, type TripClinic } from './trip-learning.service';

export const ROUTE_TIME = Symbol('ROUTE_TIME');

/** Minutes to park and walk in. */
/** Built-in defaults; the live values are Owner Portal settings. */
export const PARK_AND_WALK_MINUTES = 5;
/** Arrive this early to check in: longer for a first visit (registration). */
export const CHECK_IN_MINUTES = { initial: 10, followUp: 5 } as const;

/** traffic, roads and estimate as from the router; learned: roads or estimate corrected by real Saxlem trips. */
export type DepartureSource = RouteTime['source'] | 'learned';

export interface DeparturePlan {
  readonly leaveAt: Date;
  readonly arriveBy: Date;
  readonly travelSeconds: number;
  readonly distanceMeters: number;
  readonly source: DepartureSource;
  readonly computedAt: Date;
}

export interface OnTheWay {
  readonly onTheWayAt: Date;
  /** When the patient should reach reception. */
  readonly arrivalEta: Date;
  readonly travelSeconds: number;
  readonly distanceMeters: number;
  readonly source: DepartureSource;
}

/** "I'm on my way" is accepted from 6 hours before the visit until it ends. */
export const ON_THE_WAY_WINDOW_HOURS = 6;

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
    private readonly learning: TripLearningService,
    @Optional()
    private readonly settings: AppSettings = AppSettings.defaults(),
  ) {}

  /** Owner Portal → App settings → Leave by. */
  private checkInMinutes(type: 'initial' | 'followUp') {
    return this.settings.int(
      type === 'initial'
        ? 'leaveBy.checkInFirstVisit'
        : 'leaveBy.checkInFollowUp',
    );
  }
  private parkMs() {
    return this.settings.int('leaveBy.parkAndWalk') * 60_000;
  }
  private requireOn() {
    if (!this.settings.bool('features.leaveBy'))
      throw new NotFoundException('Leave-by is switched off.');
  }

  async plan(
    access: AppointmentAccess,
    appointmentId: string,
    origin: LatLng,
    now = new Date(),
  ): Promise<DeparturePlan> {
    this.requireOn();
    const { appointment, clinic, destination } = await this.trip(
      access,
      appointmentId,
      origin,
    );
    const arriveBy = new Date(
      new Date(appointment.startsAt).getTime() -
        this.checkInMinutes(appointment.type) * 60_000,
    );
    const leaveFor = (route: { seconds: number }) =>
      new Date(arriveBy.getTime() - route.seconds * 1000 - this.parkMs());
    // First with traffic now, then with the traffic expected when they
    // actually set off (Google predicts it), if that is later.
    let route: Route = await this.routes.drive(origin, destination, now);
    let leaveAt = leaveFor(route);
    if (
      route.source === 'traffic' &&
      leaveAt.getTime() > now.getTime() + 10 * 60_000
    ) {
      route = await this.routes.drive(origin, destination, leaveAt);
      leaveAt = leaveFor(route);
    } else {
      // Without live traffic, correct for how long Saxlem patients really
      // took around that hour.
      route = await this.learned(clinic, route, leaveAt, now);
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

  /**
   * "I'm on my way": tells reception when to expect the patient and keeps
   * the routed drive time (not the position) to learn from once they check
   * in.
   */
  async onTheWay(
    access: AppointmentAccess,
    appointmentId: string,
    origin: LatLng,
    now = new Date(),
  ): Promise<OnTheWay> {
    this.requireOn();
    const { appointment, clinic, destination } = await this.trip(
      access,
      appointmentId,
      origin,
    );
    const startsAt = new Date(appointment.startsAt).getTime();
    if (
      startsAt - now.getTime() > ON_THE_WAY_WINDOW_HOURS * 3_600_000 ||
      now.getTime() > new Date(appointment.endsAt).getTime()
    )
      throw new ConflictException('This visit is not today or has ended.');
    const arrival = await this.prisma.db.appointmentArrival.findUnique({
      where: { appointmentId: appointment.id },
      select: { status: true },
    });
    if (arrival && arrival.status !== 'expected')
      throw new ConflictException('The patient has already arrived.');
    const raw = await this.routes.drive(origin, destination, now);
    const route =
      raw.source === 'traffic'
        ? raw
        : await this.learned(clinic, raw, now, now);
    const arrivalEta = new Date(
      now.getTime() + route.seconds * 1000 + this.parkMs(),
    );
    const trip = {
      startedAt: now,
      arrivalEta,
      routeSeconds: Math.max(1, Math.min(86_400, raw.seconds)),
      distanceBand: distanceBand(raw.meters),
      basis: BASIS_CODE[raw.source],
    };
    await this.prisma.db.appointmentTrip.upsert({
      where: { appointmentId: appointment.id },
      create: {
        appointmentId: appointment.id,
        organizationId: appointment.organizationId,
        clinicId: appointment.clinicId,
        ...trip,
      },
      update: trip,
    });
    return Object.freeze({
      onTheWayAt: now,
      arrivalEta,
      travelSeconds: route.seconds,
      distanceMeters: route.meters,
      source: route.source,
    });
  }

  private async learned(
    clinic: TripClinic,
    route: Route,
    at: Date,
    now: Date,
  ): Promise<Route> {
    if (route.source === 'traffic' || route.source === 'learned') return route;
    const { factor, trips } = await this.learning.factor(
      clinic,
      route.source,
      route.meters,
      at,
      now,
    );
    if (trips < MIN_TRIPS) return route;
    return {
      seconds: Math.round(route.seconds * factor),
      meters: route.meters,
      source: 'learned',
    };
  }

  /** Checks shared by planning and "on my way". */
  private async trip(
    access: AppointmentAccess,
    appointmentId: string,
    origin: LatLng,
  ) {
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
      select: { latitude: true, longitude: true, city: true, timezone: true },
    });
    if (clinic?.latitude == null || clinic.longitude == null)
      throw new ConflictException(
        "The clinic hasn't added its map location yet.",
      );
    return {
      appointment,
      clinic: {
        id: appointment.clinicId,
        city: clinic.city,
        timezone: clinic.timezone,
      } satisfies TripClinic,
      destination: { latitude: clinic.latitude, longitude: clinic.longitude },
    };
  }
}

type Route = Omit<RouteTime, 'source'> & { source: DepartureSource };
