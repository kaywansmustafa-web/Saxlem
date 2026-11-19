/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createApplication } from '../../src/main';
import {
  apiConfiguration,
  apiPrisma,
  createRolePrincipal,
  createSeededQueue,
} from './live-queue-api-fixture';

jest.setTimeout(30_000);

describe('payment history and receipts', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication(apiConfiguration);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('lists only money that changed hands, newest first, for the owner only', async () => {
    const seeded = await createSeededQueue(4);
    const [counter, online, refunded, unpaid] = seeded.appointments;
    const base = {
      organizationId: seeded.tenant.organizationId,
      clinicId: seeded.tenant.clinicId,
      amountIqd: 25000,
    };
    await apiPrisma.appointmentPayment.createMany({
      data: [
        {
          ...base,
          appointmentId: counter!.id,
          method: 'counter',
          status: 'paid',
          paidAt: new Date('2026-11-01T08:00:00Z'),
          recordedByUserId: seeded.manager.userId,
          callbackToken: randomUUID() + randomUUID(),
        },
        {
          ...base,
          appointmentId: online!.id,
          method: 'online',
          provider: 'fib',
          providerPaymentId: `fib-${randomUUID()}`,
          status: 'paid',
          paidAt: new Date('2026-11-03T08:00:00Z'),
          collectedBy: 'platform',
          callbackToken: randomUUID() + randomUUID(),
        },
        {
          ...base,
          appointmentId: refunded!.id,
          method: 'online',
          provider: 'fib',
          providerPaymentId: `fib-${randomUUID()}`,
          status: 'refunded',
          paidAt: new Date('2026-11-02T08:00:00Z'),
          refundedAt: new Date('2026-11-02T09:00:00Z'),
          collectedBy: 'platform',
          callbackToken: randomUUID() + randomUUID(),
        },
        {
          ...base,
          appointmentId: unpaid!.id,
          method: 'counter',
          status: 'dueAtCounter',
          callbackToken: randomUUID() + randomUUID(),
        },
      ],
    });
    const server = app.getHttpServer();
    const as = (token: string) => ({ authorization: `Bearer ${token}` });

    const first = await request(server)
      .get('/api/v1/patients/me/payments?pageSize=2')
      .set(as(seeded.patient.token))
      .expect(200);
    expect(
      first.body.items.map((r: { appointmentId: string }) => r.appointmentId),
    ).toEqual([online!.id, refunded!.id]);
    expect(first.body.items[0]).toMatchObject({
      method: 'online',
      provider: 'fib',
      collectedBy: 'platform',
      amountIqd: 25000,
      currency: 'IQD',
      status: 'paid',
      patientName: 'Private Patient',
      reference: expect.stringMatching(/^SX-/),
    });
    expect(first.body.items[0].transactionId).toMatch(/^fib-/);
    expect(first.body.items[1]).toMatchObject({
      status: 'refunded',
      refundedAt: '2026-11-02T09:00:00.000Z',
    });
    const second = await request(server)
      .get(
        `/api/v1/patients/me/payments?pageSize=2&cursor=${first.body.nextCursor}`,
      )
      .set(as(seeded.patient.token))
      .expect(200);
    expect(second.body.items).toHaveLength(1);
    expect(second.body.items[0]).toMatchObject({
      appointmentId: counter!.id,
      method: 'counter',
      transactionId: null,
      collectedBy: null,
    });
    expect(second.body.nextCursor).toBeNull();

    const receipt = await request(server)
      .get(`/api/v1/appointments/${counter!.id}/receipt`)
      .set(as(seeded.patient.token))
      .expect(200);
    expect(receipt.body.id).toBe(second.body.items[0].id);
    // Not paid yet: no receipt.
    await request(server)
      .get(`/api/v1/appointments/${unpaid!.id}/receipt`)
      .set(as(seeded.patient.token))
      .expect(404);

    // Someone else's receipts are not visible; staff don't use this.
    const other = await createRolePrincipal('patient', seeded.tenant);
    await request(server)
      .get(`/api/v1/appointments/${counter!.id}/receipt`)
      .set(as(other.token))
      .expect(404);
    const theirs = await request(server)
      .get('/api/v1/patients/me/payments')
      .set(as(other.token))
      .expect(200);
    expect(theirs.body.items).toEqual([]);
    await request(server)
      .get('/api/v1/patients/me/payments')
      .set(as(seeded.manager.token))
      .expect(403);
    await request(server)
      .get('/api/v1/patients/me/payments?cursor=nonsense')
      .set(as(seeded.patient.token))
      .expect(400);
  });
});
