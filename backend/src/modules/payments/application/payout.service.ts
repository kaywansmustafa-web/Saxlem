import {
  BadRequestException,
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
  type DoctorPayoutProfile,
  type PayoutProfile,
  type PayoutRepository,
} from '../domain/payout';

/** Platform-collection bookkeeping: the payments ledger, the online switch
 * and where Saxlem pays each doctor. Settlements are 30-day statements
 * (StatementService). */
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

  private doctorProfileProjection(
    organizationId: string,
    doctorId: string,
    profile: DoctorPayoutProfile | null,
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
    profile: PayoutProfile | null,
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
