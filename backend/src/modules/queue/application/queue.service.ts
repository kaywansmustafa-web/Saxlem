import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import type { QueueAccess, QueueCommand, QueuePolicy } from '../domain/queue';
import {
  QUEUE_REPOSITORY,
  type QueueRepository,
} from '../domain/queue.repository';

@Injectable()
export class QueueService {
  private readonly policy: QueuePolicy;
  constructor(
    @Inject(QUEUE_REPOSITORY) private readonly repository: QueueRepository,
    @Inject(BACKEND_CONFIGURATION) configuration: BackendConfiguration,
  ) {
    this.policy = Object.freeze({
      recallGraceMinutes: configuration.queueRecallGraceMinutes,
      busyThresholdMinutes: configuration.queueHealthBusyThresholdMinutes,
      delayedThresholdMinutes: configuration.queueHealthDelayedThresholdMinutes,
      fallbackConsultationMinutes:
        configuration.queueFallbackConsultationMinutes,
    });
  }
  async get(access: QueueAccess, id: string) {
    this.require(access, 'queue:read');
    this.requireDoctorTenant(access);
    return this.found(await this.repository.get(access, id));
  }
  async current(
    access: QueueAccess,
    clinicId: string,
    doctorId: string,
    now = new Date(),
  ) {
    this.require(access, 'queue:read');
    this.requireDoctorTenant(access, clinicId);
    return this.found(
      await this.repository.getCurrent(access, clinicId, doctorId, now),
    );
  }
  async patientStatus(access: QueueAccess, appointmentId: string) {
    this.require(access, 'queue:patient-status:read');
    return this.found(
      await this.repository.getPatientStatus(
        access,
        appointmentId,
        this.policy,
      ),
    );
  }
  async entries(
    access: QueueAccess,
    id: string,
    pageSize: number,
    cursor?: string,
    includeTerminal = false,
  ) {
    this.require(access, 'queue:read');
    this.requireDoctorTenant(access);
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
      throw new BadRequestException('Page size must be between 1 and 100.');
    return this.found(
      await this.repository.listEntries(
        access,
        id,
        pageSize,
        cursor,
        includeTerminal,
      ),
    );
  }
  async open(
    access: QueueAccess,
    clinicId: string,
    doctorId: string,
    version: number,
    key: string,
    requestId: string,
    now = new Date(),
  ) {
    this.mutate(access, 'queue:open', clinicId);
    const date = await this.operationalDate(clinicId, now);
    return this.repository.open(
      access,
      clinicId,
      doctorId,
      date,
      this.policy.recallGraceMinutes,
      this.version(version),
      now,
      requestId,
      this.command(key, `queue.open:${clinicId}:${doctorId}`, {
        clinicId,
        doctorId,
        version,
      }),
    );
  }
  async enqueue(
    access: QueueAccess,
    id: string,
    appointmentId: string,
    version: number,
    key: string,
    requestId: string,
    now = new Date(),
  ) {
    this.mutate(access, 'queue:enqueue');
    return this.repository.enqueue(
      access,
      id,
      appointmentId,
      this.version(version),
      now,
      requestId,
      this.command(key, `queue.enqueue:${id}`, { appointmentId, version }),
    );
  }
  async sessionCommand(
    access: QueueAccess,
    id: string,
    operation: 'pause' | 'resume' | 'close',
    version: number,
    reason: string | null,
    key: string,
    requestId: string,
    now = new Date(),
  ) {
    this.mutate(access, `queue:${operation}`);
    return this.repository.transitionSession(
      access,
      id,
      operation,
      this.version(version),
      reason,
      now,
      requestId,
      this.command(key, `queue.${operation}:${id}`, { version, reason }),
    );
  }
  async callNext(
    access: QueueAccess,
    id: string,
    version: number,
    key: string,
    requestId: string,
    now = new Date(),
  ) {
    this.mutate(access, 'queue:call-next');
    return this.repository.callNext(
      access,
      id,
      this.version(version),
      now,
      requestId,
      this.command(key, `queue.call-next:${id}`, { version }),
    );
  }
  async entryCommand(
    access: QueueAccess,
    id: string,
    entryId: string,
    operation: 'recall' | 'no-response' | 'start' | 'complete',
    sessionVersion: number,
    entryVersion: number,
    key: string,
    requestId: string,
    now = new Date(),
  ) {
    const capability = {
      recall: 'queue:recall',
      'no-response': 'queue:mark-no-response',
      start: 'queue:consultation:start',
      complete: 'queue:consultation:complete',
    }[operation];
    this.mutate(access, capability);
    return this.repository.transitionEntry(
      access,
      id,
      entryId,
      operation,
      this.version(sessionVersion),
      this.version(entryVersion),
      this.policy,
      now,
      requestId,
      this.command(key, `queue.${operation}:${id}:${entryId}`, {
        sessionVersion,
        entryVersion,
      }),
    );
  }
  private mutate(access: QueueAccess, capability: string, clinicId?: string) {
    if (access.patient || access.platformAdministrator)
      throw new ForbiddenException('Routine queue mutation is unavailable.');
    this.require(access, capability);
    this.requireDoctorTenant(access, clinicId);
  }
  private requireDoctorTenant(access: QueueAccess, clinicId?: string) {
    if (!access.doctor) return;
    if (
      !access.organizationId ||
      !access.clinicId ||
      (clinicId !== undefined && clinicId !== access.clinicId)
    )
      throw new NotFoundException('Queue was not found.');
  }
  private require(access: QueueAccess, capability: string) {
    if (!access.capabilities.has(capability))
      throw new ForbiddenException('Required capability is unavailable.');
  }
  private version(value: number) {
    if (!Number.isInteger(value) || value < 1)
      throw new BadRequestException('Version must be a positive integer.');
    return value;
  }
  private command(key: string, scope: string, input: object): QueueCommand {
    if (!/^[\x21-\x7E]{8,128}$/.test(key))
      throw new BadRequestException(
        'A valid Idempotency-Key header is required.',
      );
    return Object.freeze({
      key,
      scope,
      hash: createHash('sha256').update(JSON.stringify(input)).digest('hex'),
    });
  }
  private found<T>(value: T | null): T {
    if (!value) throw new NotFoundException('Queue was not found.');
    return value;
  }
  private async operationalDate(clinicId: string, now: Date): Promise<Date> {
    return this.repository.operationalDate(clinicId, now);
  }
}
