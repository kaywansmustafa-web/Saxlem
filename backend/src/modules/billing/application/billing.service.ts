import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import {
  baghdadDay,
  baghdadMidnight,
} from '../../../common/billing/billing-cycle';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import {
  BILLING_REPOSITORY,
  type BillingRepository,
} from '../domain/billing.repository';
import {
  BILLING_TIMEZONE,
  type BillingAccess,
  type BillingCursor,
} from '../domain/billing';

@Injectable()
export class BillingService {
  constructor(
    @Inject(BILLING_REPOSITORY) private readonly repository: BillingRepository,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  plans(access: BillingAccess) {
    this.read(access);
    return this.repository.plans();
  }
  async plan(access: BillingAccess, id: string) {
    this.read(access);
    const row = await this.repository.plan(id);
    if (!row) throw new NotFoundException('Billing plan was not found.');
    return row;
  }
  async organizationPlan(
    access: BillingAccess,
    organizationId: string,
    at = new Date(),
  ) {
    this.scope(access, organizationId);
    const row = await this.repository.organizationPlan(organizationId, at);
    if (!row)
      throw new NotFoundException('Organization billing plan was not found.');
    return row;
  }

  assignPlan(
    access: BillingAccess,
    organizationId: string,
    planId: string,
    effectiveFrom: Date,
    expectedVersion: number | null,
    key: string,
    requestId: string,
  ) {
    if (!access.platformAdministrator)
      throw new ForbiddenException(
        'Billing plan management requires platform administration.',
      );
    if (!Number.isFinite(effectiveFrom.getTime()))
      throw new BadRequestException('Effective date is invalid.');
    return this.repository.assignPlan(
      access,
      organizationId,
      planId,
      effectiveFrom,
      expectedVersion,
      requestId,
      this.command(key, 'billing.plan.assign', {
        organizationId,
        planId,
        effectiveFrom: effectiveFrom.toISOString(),
        expectedVersion,
      }),
    );
  }

  createPlan(
    access: BillingAccess,
    input: { displayName: string; commissionAmountIqd: number },
    requestId: string,
  ) {
    this.manage(access);
    const displayName = input.displayName.trim();
    if (!displayName || displayName.length > 80)
      throw new BadRequestException('Give the plan a name (up to 80 letters).');
    if (
      !Number.isInteger(input.commissionAmountIqd) ||
      input.commissionAmountIqd < 0 ||
      input.commissionAmountIqd > 1_000_000
    )
      throw new BadRequestException(
        'The charge must be a whole number from 0 to 1,000,000 IQD.',
      );
    return this.repository.createPlan(
      access,
      { displayName, commissionAmountIqd: input.commissionAmountIqd },
      requestId,
    );
  }
  setPlanStatus(
    access: BillingAccess,
    id: string,
    status: 'active' | 'inactive',
    requestId: string,
  ) {
    this.manage(access);
    return this.repository.setPlanStatus(access, id, status, requestId);
  }
  async setup(access: BillingAccess, organizationId: string, now = new Date()) {
    this.scope(access, organizationId);
    const row = await this.repository.setup(organizationId, now);
    if (!row) throw new NotFoundException('Organization was not found.');
    return row;
  }
  /** Plans apply from the start of a Baghdad day, today or later. */
  assignDoctorPlan(
    access: BillingAccess,
    organizationId: string,
    doctorId: string,
    planId: string | null,
    day: string,
    requestId: string,
    now = new Date(),
  ) {
    this.manage(access);
    return this.repository.assignDoctorPlan(
      access,
      organizationId,
      doctorId,
      planId,
      this.fromDay(day, now),
      requestId,
    );
  }
  async setCycleStart(
    access: BillingAccess,
    organizationId: string,
    day: string,
    requestId: string,
    now = new Date(),
  ) {
    this.manage(access);
    let start: Date;
    try {
      start = baghdadMidnight(day);
    } catch {
      throw new BadRequestException('Use a date like 2026-11-17.');
    }
    if (start > now)
      throw new BadRequestException('The start date cannot be in the future.');
    await this.repository.setCycleStart(access, organizationId, day, requestId);
    return this.setup(access, organizationId, now);
  }
  creditCommission(
    access: BillingAccess,
    id: string,
    reason: string,
    requestId: string,
  ) {
    this.manage(access);
    const text = reason.trim();
    if (!text || text.length > 500)
      throw new BadRequestException('Write why this charge is credited.');
    return this.repository.creditCommission(access, id, text, requestId);
  }
  /** Day-based plan changes for the Owner Portal: from that Baghdad day. */
  fromDay(day: string, now = new Date()) {
    let start: Date;
    try {
      start = baghdadMidnight(day);
    } catch {
      throw new BadRequestException('Use a date like 2026-11-17.');
    }
    if (start < baghdadMidnight(baghdadDay(now)))
      throw new BadRequestException(
        'Plan changes start today or later; past charges never change.',
      );
    return start;
  }

  async commissions(
    access: BillingAccess,
    organizationId: string,
    pageSize: number,
    cursor?: string,
    doctorId?: string,
  ) {
    this.scope(access, organizationId);
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
      throw new BadRequestException(
        'Billing page size must be between 1 and 100.',
      );
    const binding = `${access.actorId}:${organizationId}:${access.clinicId ?? '*'}:${doctorId ?? '*'}:${pageSize}`;
    const page = await this.repository.commissions(
      access,
      organizationId,
      pageSize,
      cursor ? this.decode(cursor, binding) : undefined,
      doctorId,
    );
    return Object.freeze({
      items: page.items,
      nextCursor: page.next ? this.encode(page.next, binding) : null,
    });
  }

  statements(access: BillingAccess, organizationId: string, doctorId?: string) {
    this.scope(access, organizationId);
    return this.repository.statements(access, organizationId, doctorId);
  }
  async statement(access: BillingAccess, id: string) {
    this.read(access);
    const row = await this.repository.statement(access, id);
    if (!row) throw new NotFoundException('Billing statement was not found.');
    return row;
  }
  /** One running statement per doctor: each doctor is billed separately. */
  currentStatements(
    access: BillingAccess,
    organizationId: string,
    doctorId?: string,
    now = new Date(),
  ) {
    this.scope(access, organizationId);
    return this.repository.currentStatements(
      access,
      organizationId,
      this.period(now),
      doctorId,
    );
  }
  finalize(
    access: BillingAccess,
    id: string,
    version: number,
    key: string,
    requestId: string,
  ) {
    if (!access.platformAdministrator)
      throw new ForbiddenException(
        'Statement finalization requires platform administration.',
      );
    return this.repository.finalize(
      access,
      id,
      version,
      requestId,
      this.command(key, `billing.statement.finalize:${id}`, { id, version }),
    );
  }

  private manage(access: BillingAccess) {
    if (!access.platformAdministrator)
      throw new ForbiddenException(
        'Billing plan management requires platform administration.',
      );
  }
  private read(access: BillingAccess) {
    if (!access.platformAdministrator && !access.organizationId)
      throw new ForbiddenException('Billing access requires an organization.');
  }
  private scope(access: BillingAccess, organizationId: string) {
    this.read(access);
    if (
      !access.platformAdministrator &&
      access.organizationId !== organizationId
    )
      throw new ForbiddenException(
        'Billing organization scope does not match the session.',
      );
  }
  private command(key: string, scope: string, body: object) {
    if (!/^[\x21-\x7e]{8,128}$/u.test(key))
      throw new BadRequestException(
        'A valid Idempotency-Key header is required.',
      );
    return Object.freeze({
      key,
      scope,
      hash: createHash('sha256').update(JSON.stringify(body)).digest('hex'),
    });
  }
  private period(now: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: BILLING_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(now);
    const year = Number(parts.find((x) => x.type === 'year')!.value),
      month = Number(parts.find((x) => x.type === 'month')!.value);
    return Object.freeze({
      start: new Date(Date.UTC(year, month - 1, 1, -3)),
      end: new Date(Date.UTC(year, month, 1, -3)),
    });
  }
  private encode(cursor: BillingCursor, binding: string) {
    const payload = Buffer.from(
      JSON.stringify({
        recognizedAt: cursor.recognizedAt.toISOString(),
        id: cursor.id,
        binding,
      }),
    ).toString('base64url');
    return `${payload}.${this.sign(payload)}`;
  }
  private decode(cursor: string, binding: string): BillingCursor {
    try {
      if (cursor.length > 2048) throw new Error();
      const [payload, signature, extra] = cursor.split('.');
      if (
        !payload ||
        !signature ||
        extra ||
        !this.equal(signature, this.sign(payload))
      )
        throw new Error();
      const value = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as { recognizedAt?: string; id?: string; binding?: string };
      const recognizedAt = new Date(value.recognizedAt ?? '');
      if (
        value.binding !== binding ||
        !value.id ||
        !/^[0-9a-f-]{36}$/iu.test(value.id) ||
        !Number.isFinite(recognizedAt.getTime())
      )
        throw new Error();
      return { recognizedAt, id: value.id };
    } catch {
      throw new BadRequestException('Billing cursor is invalid.');
    }
  }
  private sign(payload: string) {
    return createHmac('sha256', this.configuration.auditHashSecret)
      .update(`billing-cursor:${payload}`)
      .digest('base64url');
  }
  private equal(left: string, right: string) {
    const a = Buffer.from(left),
      b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
