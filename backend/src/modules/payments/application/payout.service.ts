import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import type { PaymentAccess } from '../domain/payment';
import {
  PAYOUT_REPOSITORY,
  baghdadMonth,
  payoutTotals,
  type PayoutInputs,
  type PayoutRepository,
} from '../domain/payout';

/** Platform-collection bookkeeping: the payments ledger and the monthly
 * settlement Saxlem makes with each doctor (each doctor is billed and paid
 * separately). */
@Injectable()
export class PayoutService {
  constructor(
    @Inject(PAYOUT_REPOSITORY)
    private readonly repository: PayoutRepository,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  settings() {
    const platform = this.configuration.paymentPlatformAccount;
    return Object.freeze({
      collectionMode: this.configuration.paymentCollectionMode,
      onlineEnabled: this.configuration.paymentsOnlineEnabled,
      platformAccount: platform
        ? {
            provider: platform.provider,
            environment: platform.environment,
            clientIdHint: `…${platform.clientId.slice(-4)}`,
          }
        : null,
      providerFeeBps: this.configuration.paymentProviderFeeBps,
      feePassedToClinic: this.configuration.paymentFeePassedToClinic,
    });
  }

  async ledger(input: {
    month: string;
    organizationId?: string;
    method?: 'counter' | 'online';
    cursor?: string;
    pageSize?: number;
  }) {
    const { start, end } = this.month(input.month);
    const page = await this.repository.ledger({
      from: start,
      to: end,
      organizationId: input.organizationId,
      method: input.method,
      cursor: input.cursor,
      pageSize: Math.min(Math.max(input.pageSize ?? 50, 1), 100),
    });
    return {
      items: page.items.map((item) => ({
        ...item,
        bookedAt: item.bookedAt.toISOString(),
        appointmentStartsAt: item.appointmentStartsAt.toISOString(),
        paidAt: item.paidAt?.toISOString() ?? null,
        refundedAt: item.refundedAt?.toISOString() ?? null,
      })),
      nextCursor: page.nextCursor,
    };
  }

  /** Every doctor's settlement for a month, settled or not. */
  async summary(month: string, now = new Date()) {
    const period = this.month(month);
    const payees = await this.repository.payees(period.start, period.end);
    const items = [];
    for (const payee of payees) {
      const inputs = await this.repository.inputs(
        payee.organizationId,
        payee.doctorId,
        period.start,
        period.end,
      );
      items.push(this.project(inputs, period, now));
    }
    return {
      month,
      periodStart: period.start.toISOString(),
      periodEnd: period.end.toISOString(),
      monthEnded: period.end <= now,
      items,
    };
  }

  async detail(
    organizationId: string,
    doctorId: string,
    month: string,
    now = new Date(),
  ) {
    const period = this.month(month);
    const inputs = await this.inputs(organizationId, doctorId, period);
    return this.project(inputs, period, now);
  }

  async settle(
    access: PaymentAccess,
    organizationId: string,
    doctorId: string,
    input: {
      month: string;
      expectedNetPayableIqd: number;
      reference: string;
      note?: string;
    },
    requestId: string,
    now = new Date(),
  ) {
    if (!access.platformAdministrator)
      throw new ForbiddenException(
        'Platform administrator access is required.',
      );
    const period = this.month(input.month);
    if (period.end > now)
      throw new ConflictException('A month can be settled once it has ended.');
    const inputs = await this.inputs(organizationId, doctorId, period);
    if (inputs.settled)
      throw new ConflictException('This month is already settled.');
    const totals = this.totals(inputs);
    if (
      totals.paymentCount === 0 &&
      totals.clawbackIqd === 0 &&
      totals.commissionIqd === 0
    )
      throw new ConflictException('There is nothing to settle for this month.');
    if (totals.netPayableIqd !== input.expectedNetPayableIqd)
      throw new ConflictException(
        'The amounts changed. Refresh and check them again.',
      );
    const settled = await this.repository.settle({
      organizationId,
      doctorId,
      start: period.start,
      end: period.end,
      expected: totals,
      feeBps: this.configuration.paymentProviderFeeBps,
      feePassedToClinic: this.configuration.paymentFeePassedToClinic,
      reference: input.reference.trim(),
      note: input.note?.trim() || null,
      actorUserId: access.actorId,
      requestId,
    });
    if (!settled)
      throw new ConflictException(
        'The amounts changed or the month was settled. Refresh and try again.',
      );
    return this.detail(organizationId, doctorId, input.month, now);
  }

  async profile(organizationId: string) {
    const inputs = await this.repository.profile(organizationId);
    return this.profileProjection(organizationId, inputs);
  }

  async saveProfile(
    access: PaymentAccess,
    organizationId: string,
    input: {
      onlinePaymentsEnabled: boolean;
      payoutAccountName?: string | null;
      payoutAccountNumber?: string | null;
    },
    requestId: string,
  ) {
    if (!access.platformAdministrator)
      throw new ForbiddenException(
        'Platform administrator access is required.',
      );
    const organizations = await this.repository.organizations();
    if (!organizations.some((o) => o.id === organizationId))
      throw new NotFoundException('Organization was not found.');
    const current = await this.repository.profile(organizationId);
    const saved = await this.repository.saveProfile(
      organizationId,
      {
        onlinePaymentsEnabled: input.onlinePaymentsEnabled,
        payoutAccountName:
          input.payoutAccountName === undefined
            ? (current?.payoutAccountName ?? null)
            : input.payoutAccountName?.trim() || null,
        payoutAccountNumber:
          input.payoutAccountNumber === undefined
            ? (current?.payoutAccountNumber ?? null)
            : input.payoutAccountNumber?.replace(/\s+/g, '') || null,
      },
      access.actorId,
      requestId,
    );
    return this.profileProjection(organizationId, saved);
  }

  /** Where Saxlem sends one doctor's money. */
  async doctorProfile(organizationId: string, doctorId: string) {
    await this.payee(organizationId, doctorId);
    return this.doctorProfileProjection(
      organizationId,
      doctorId,
      await this.repository.doctorProfile(organizationId, doctorId),
    );
  }

  async saveDoctorProfile(
    access: PaymentAccess,
    organizationId: string,
    doctorId: string,
    input: {
      payoutAccountName?: string | null;
      payoutAccountNumber?: string | null;
    },
    requestId: string,
  ) {
    if (!access.platformAdministrator)
      throw new ForbiddenException(
        'Platform administrator access is required.',
      );
    await this.payee(organizationId, doctorId);
    const current = await this.repository.doctorProfile(
      organizationId,
      doctorId,
    );
    const saved = await this.repository.saveDoctorProfile(
      organizationId,
      doctorId,
      {
        payoutAccountName:
          input.payoutAccountName === undefined
            ? (current?.payoutAccountName ?? null)
            : input.payoutAccountName?.trim() || null,
        payoutAccountNumber:
          input.payoutAccountNumber === undefined
            ? (current?.payoutAccountNumber ?? null)
            : input.payoutAccountNumber?.replace(/\s+/g, '') || null,
      },
      access.actorId,
      requestId,
    );
    return this.doctorProfileProjection(organizationId, doctorId, saved);
  }

  private async payee(organizationId: string, doctorId: string) {
    const payee = await this.repository.payee(organizationId, doctorId);
    if (!payee)
      throw new NotFoundException('Doctor was not found in the organization.');
    return payee;
  }

  private async inputs(
    organizationId: string,
    doctorId: string,
    period: { start: Date; end: Date },
  ) {
    await this.payee(organizationId, doctorId);
    return this.repository.inputs(
      organizationId,
      doctorId,
      period.start,
      period.end,
    );
  }

  private totals(inputs: PayoutInputs) {
    return payoutTotals(
      inputs,
      this.configuration.paymentProviderFeeBps,
      this.configuration.paymentFeePassedToClinic,
    );
  }

  private project(
    inputs: PayoutInputs,
    period: { start: Date; end: Date },
    now: Date,
  ) {
    const totals = inputs.settled ?? this.totals(inputs);
    return {
      organizationId: inputs.organizationId,
      organizationName: inputs.organizationName,
      doctorId: inputs.doctorId,
      doctorName: inputs.doctorName,
      periodStart: period.start.toISOString(),
      periodEnd: period.end.toISOString(),
      status: inputs.settled
        ? ('settled' as const)
        : period.end <= now
          ? ('ready' as const)
          : ('open' as const),
      grossCollectedIqd: totals.grossCollectedIqd,
      clawbackIqd: totals.clawbackIqd,
      providerFeeIqd: totals.providerFeeIqd,
      commissionIqd: totals.commissionIqd,
      netPayableIqd: totals.netPayableIqd,
      paymentCount: totals.paymentCount,
      settlement: inputs.settled
        ? {
            id: inputs.settled.id,
            reference: inputs.settled.reference,
            note: inputs.settled.note,
            settledAt: inputs.settled.settledAt.toISOString(),
          }
        : null,
      payoutAccount: this.accountHint(inputs.doctorProfile),
    };
  }

  private doctorProfileProjection(
    organizationId: string,
    doctorId: string,
    profile: PayoutInputs['doctorProfile'],
  ) {
    return {
      organizationId,
      doctorId,
      payoutAccountName: profile?.payoutAccountName ?? null,
      payoutAccountNumberHint: profile?.payoutAccountNumber
        ? `…${profile.payoutAccountNumber.slice(-4)}`
        : null,
      version: profile?.version ?? 0,
    };
  }

  private accountHint(
    profile: {
      payoutAccountName: string | null;
      payoutAccountNumber: string | null;
    } | null,
  ) {
    if (!profile?.payoutAccountNumber) return null;
    return {
      name: profile.payoutAccountName,
      numberHint: `…${profile.payoutAccountNumber.slice(-4)}`,
    };
  }

  private profileProjection(
    organizationId: string,
    profile: PayoutInputs['profile'],
  ) {
    return {
      organizationId,
      onlinePaymentsEnabled: profile?.onlinePaymentsEnabled ?? false,
      payoutAccountName: profile?.payoutAccountName ?? null,
      payoutAccountNumberHint: profile?.payoutAccountNumber
        ? `…${profile.payoutAccountNumber.slice(-4)}`
        : null,
      version: profile?.version ?? 0,
    };
  }

  private month(month: string) {
    try {
      return baghdadMonth(month);
    } catch {
      throw new BadRequestException('Month must look like 2026-11.');
    }
  }
}
