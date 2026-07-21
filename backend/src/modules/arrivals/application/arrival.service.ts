import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { AppointmentService } from '../../appointments/application/appointment.service';
import type {
  ArrivalAccess,
  ArrivalCommand,
  ArrivalProjection,
} from '../domain/arrival';
import { ArrivalAuditPersistenceError } from '../domain/arrival.errors';
import {
  ARRIVAL_REPOSITORY,
  type ArrivalRepository,
} from '../domain/arrival.repository';

@Injectable()
export class ArrivalService {
  constructor(
    @Inject(ARRIVAL_REPOSITORY)
    private readonly repository: ArrivalRepository,
    private readonly appointments: AppointmentService,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  async get(access: ArrivalAccess, appointmentId: string, requestId: string) {
    await this.appointments.get(access, appointmentId, requestId);
    const arrival = await this.repository.get(access, appointmentId);
    if (!arrival) throw new NotFoundException('Arrival was not found.');
    if (!access.patient) await this.audit(access, arrival, requestId);
    return arrival;
  }

  async record(
    access: ArrivalAccess,
    appointmentId: string,
    expectedVersion: number,
    idempotencyKey: string,
    requestId: string,
    now = new Date(),
  ) {
    const appointment = await this.appointments.get(
      access,
      appointmentId,
      requestId,
    );
    const command = this.command(
      idempotencyKey,
      appointmentId,
      expectedVersion,
    );
    const replay = await this.execute(() =>
      this.repository.replay(access, appointmentId, command),
    );
    if (replay) return replay;
    if (!['scheduled', 'confirmed'].includes(appointment.status))
      throw new ConflictException(
        'Cancelled, completed, or no-show appointments cannot arrive.',
      );
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1)
      throw new BadRequestException(
        'Arrival version must be a positive integer.',
      );
    this.assertWindow(new Date(appointment.startsAt), now);
    return this.execute(() =>
      this.repository.record(
        access,
        appointmentId,
        expectedVersion,
        now,
        requestId,
        command,
        {
          earlyMinutes: this.configuration.arrivalEarlyWindowMinutes,
          lateMinutes: this.configuration.arrivalLateWindowMinutes,
        },
      ),
    );
  }

  private command(
    key: string,
    appointmentId: string,
    expectedVersion: number,
  ): ArrivalCommand {
    if (!/^[\x21-\x7E]{8,128}$/.test(key))
      throw new BadRequestException(
        'A valid Idempotency-Key header is required.',
      );
    const body = JSON.stringify({ appointmentId, expectedVersion });
    return Object.freeze({
      key,
      scope: `arrival.record:${appointmentId}`,
      hash: createHash('sha256').update(body).digest('hex'),
    });
  }

  private assertWindow(startsAt: Date, now: Date) {
    const earliest =
      startsAt.getTime() -
      this.configuration.arrivalEarlyWindowMinutes * 60_000;
    const latest =
      startsAt.getTime() + this.configuration.arrivalLateWindowMinutes * 60_000;
    if (
      !Number.isFinite(now.getTime()) ||
      now.getTime() < earliest ||
      now.getTime() > latest
    )
      throw new ConflictException(
        `Arrival is available from ${this.configuration.arrivalEarlyWindowMinutes} minutes before until ${this.configuration.arrivalLateWindowMinutes} minutes after the appointment.`,
      );
  }

  private async audit(
    access: ArrivalAccess,
    arrival: ArrivalProjection,
    requestId: string,
  ) {
    try {
      await this.repository.auditView(access, arrival, requestId);
    } catch {
      throw new ServiceUnavailableException(
        'Security audit is temporarily unavailable.',
      );
    }
  }

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ArrivalAuditPersistenceError)
        throw new ServiceUnavailableException(
          'Security audit is temporarily unavailable.',
        );
      throw error;
    }
  }
}
