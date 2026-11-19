import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  RECEIPT_STATUSES,
  type ReceiptDto,
  type ReceiptPageDto,
} from '../presentation/receipt.dto';

interface Cursor {
  readonly at: Date;
  readonly id: string;
}
const encode = (row: { paidAt: Date; id: string }) =>
  Buffer.from(`${row.paidAt.toISOString()}|${row.id}`).toString('base64url');
function decode(cursor?: string): Cursor | null {
  if (!cursor) return null;
  const [at, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  const date = new Date(at ?? '');
  if (Number.isNaN(date.getTime()) || !/^[0-9a-f-]{36}$/i.test(id ?? ''))
    throw new BadRequestException('Cursor is not valid.');
  return { at: date, id: id! };
}

const include = {
  appointment: {
    select: {
      publicReference: true,
      startsAt: true,
      clinic: {
        select: {
          name: true,
          address: true,
          area: true,
          city: true,
          phoneNumber: true,
        },
      },
      organization: { select: { name: true } },
      doctorAssignment: {
        select: { doctor: { select: { displayName: true } } },
      },
      patientRegistration: {
        select: {
          patientProfile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} satisfies Prisma.AppointmentPaymentInclude;
type Row = Prisma.AppointmentPaymentGetPayload<{ include: typeof include }>;

/**
 * Payment history for an app account: every visit paid by any of its
 * profiles, in the app or at the counter. Only money that changed hands is
 * listed (a visit still to pay at the counter is not a receipt).
 */
@Injectable()
export class ReceiptService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    cursor?: string,
    pageSize = 20,
  ): Promise<ReceiptPageDto> {
    const at = decode(cursor);
    const rows = await this.prisma.db.appointmentPayment.findMany({
      where: {
        ...this.mine(userId),
        ...(at
          ? {
              OR: [
                { paidAt: { lt: at.at } },
                { paidAt: at.at, id: { lt: at.id } },
              ],
            }
          : {}),
      },
      include,
      orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
    });
    const page = rows.slice(0, pageSize);
    const last = page.at(-1);
    return {
      items: page.map((row) => this.receipt(row)),
      nextCursor:
        rows.length > pageSize && last?.paidAt
          ? encode({ paidAt: last.paidAt, id: last.id })
          : null,
    };
  }

  async forAppointment(userId: string, appointmentId: string) {
    const row = await this.prisma.db.appointmentPayment.findFirst({
      where: { appointmentId, ...this.mine(userId) },
      include,
    });
    if (!row) throw new NotFoundException('Receipt was not found.');
    return this.receipt(row);
  }

  private mine(userId: string): Prisma.AppointmentPaymentWhereInput {
    return {
      status: { in: [...RECEIPT_STATUSES] },
      paidAt: { not: null },
      appointment: {
        patientRegistration: {
          patientProfile: { patientAccount: { userId } },
        },
      },
    };
  }

  private receipt(row: Row): ReceiptDto {
    const visit = row.appointment;
    const clinic = visit.clinic;
    const profile = visit.patientRegistration.patientProfile;
    const address = [clinic.address, clinic.area, clinic.city]
      .map((part) => part?.trim())
      .filter((part): part is string => !!part)
      .join(', ');
    return {
      id: row.id,
      appointmentId: row.appointmentId,
      reference: visit.publicReference,
      patientName: `${profile.firstName} ${profile.lastName}`.trim(),
      doctorName: visit.doctorAssignment.doctor.displayName,
      clinicName: clinic.name,
      clinicAddress: address || null,
      clinicPhone: clinic.phoneNumber,
      organizationName: visit.organization.name,
      visitStartsAt: visit.startsAt.toISOString(),
      method: row.method,
      provider: row.provider,
      transactionId: row.method === 'online' ? row.providerPaymentId : null,
      collectedBy: row.collectedBy,
      amountIqd: row.amountIqd,
      currency: 'IQD',
      status: row.status as ReceiptDto['status'],
      paidAt: row.paidAt!.toISOString(),
      refundedAt: row.refundedAt?.toISOString() ?? null,
    };
  }
}
