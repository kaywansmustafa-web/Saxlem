/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createApplication } from '../../src/main';
import { notifyPatient } from '../../src/common/notifications/patient-notifications';
import { hashOpaqueToken } from '../../src/modules/identity/domain/security';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { PushDispatchService } from '../../src/modules/notifications/push/push-dispatch.service';
import type {
  PushGateway,
  PushMessage,
  PushResult,
} from '../../src/modules/notifications/push/push-gateway';
import {
  apiConfiguration,
  apiPrisma,
  createRolePrincipal,
  createSeededQueue,
} from './live-queue-api-fixture';

jest.setTimeout(30_000);

class RecordingGateway implements PushGateway {
  sent: { token: string; message: PushMessage }[] = [];
  result: PushResult = 'sent';
  send(token: string, message: PushMessage): Promise<PushResult> {
    this.sent.push({ token, message });
    return Promise.resolve(this.result);
  }
}

describe('phone push', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication(apiConfiguration);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it('registers a phone, moves a token to whoever signs in, and stops on sign-out', async () => {
    const seeded = await createSeededQueue(0);
    const server = app.getHttpServer();
    const path = '/api/v1/patients/me/push-devices';
    const token = `fcm-${randomUUID()}-${randomUUID()}`;
    const as = (t: string) => ({ authorization: `Bearer ${t}` });

    await request(server)
      .post(path)
      .set(as(seeded.manager.token))
      .send({ token, platform: 'android', locale: 'en' })
      .expect(403);
    await request(server)
      .post(path)
      .set(as(seeded.patient.token))
      .send({ token, platform: 'windows', locale: 'en' })
      .expect(400);
    await request(server)
      .post(path)
      .set(as(seeded.patient.token))
      .send({ token, platform: 'android', locale: 'ku' })
      .expect(204);
    expect(
      await apiPrisma.pushDevice.findUnique({ where: { token } }),
    ).toMatchObject({
      userId: seeded.patient.userId,
      locale: 'ku',
      deviceId: 'queue-api-patient',
    });

    // Same phone, someone else signs in: the token is theirs now.
    const other = await createRolePrincipal('patient', seeded.tenant);
    await request(server)
      .post(path)
      .set(as(other.token))
      .send({ token, platform: 'android', locale: 'en' })
      .expect(204);
    expect(
      (await apiPrisma.pushDevice.findUnique({ where: { token } }))?.userId,
    ).toBe(other.userId);
    await request(server)
      .post(`${path}/remove`)
      .set(as(seeded.patient.token))
      .send({ token })
      .expect(204);
    expect(await apiPrisma.pushDevice.count({ where: { token } })).toBe(1);
    await request(server)
      .post(`${path}/remove`)
      .set(as(other.token))
      .send({ token })
      .expect(204);
    expect(await apiPrisma.pushDevice.count({ where: { token } })).toBe(0);

    // Signing out on the phone forgets its token.
    await request(server)
      .post(path)
      .set(as(seeded.patient.token))
      .send({ token, platform: 'ios', locale: 'en' })
      .expect(204);
    const refresh = `refresh-${randomUUID()}-${randomUUID()}`;
    await apiPrisma.refreshSession.updateMany({
      where: { userId: seeded.patient.userId },
      data: { tokenHash: hashOpaqueToken(refresh) },
    });
    await request(server)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: refresh })
      .expect((response) => expect(response.status).toBeLessThan(300));
    expect(await apiPrisma.pushDevice.count({ where: { token } })).toBe(0);
  });

  it('sends new notifications once, in the phone’s language, and drops dead tokens', async () => {
    const seeded = await createSeededQueue(1);
    const appointment = seeded.appointments[0]!;
    const token = `fcm-${randomUUID()}-${randomUUID()}`;
    await apiPrisma.pushDevice.create({
      data: {
        userId: seeded.patient.userId,
        token,
        platform: 'android',
        locale: 'ar',
      },
    });
    const gateway = new RecordingGateway();
    const service = new PushDispatchService(
      { db: apiPrisma } as unknown as PrismaService,
      gateway,
    );
    const later = () => new Date(Date.now() + 5_000);
    // Catch up with whatever earlier tests left behind.
    while ((await service.dispatch(later())).scanned > 0);
    gateway.sent = [];

    await apiPrisma.$transaction((tx) =>
      notifyPatient(tx, {
        organizationId: seeded.tenant.organizationId,
        clinicId: seeded.tenant.clinicId,
        patientProfileId: seeded.profile.id,
        type: 'appointment.reminder.soon',
        aggregateType: 'appointment',
        aggregateId: appointment.id,
        priority: 'high',
        context: {
          appointmentId: appointment.id,
          doctorName: 'Dr. Shilan',
          startsAt: '2035-01-01T06:00:00.000Z',
        },
      }),
    );
    // Not yet: a record is left a moment to settle.
    await service.dispatch(new Date());
    expect(gateway.sent).toHaveLength(0);
    await service.dispatch(later());
    expect(gateway.sent).toHaveLength(1);
    expect(gateway.sent[0]).toMatchObject({
      token,
      message: {
        title: '\u200Fموعدك قريب',
        body: '\u200FDr. Shilan · 1 كانون الثاني · 09:00',
        urgent: true,
        data: {
          type: 'appointment.reminder.soon',
          appointmentId: appointment.id,
          profileId: seeded.profile.id,
        },
      },
    });
    await service.dispatch(later());
    expect(gateway.sent).toHaveLength(1);

    gateway.result = 'invalid-token';
    await apiPrisma.$transaction((tx) =>
      notifyPatient(tx, {
        organizationId: seeded.tenant.organizationId,
        clinicId: seeded.tenant.clinicId,
        patientProfileId: seeded.profile.id,
        type: 'appointment.review.requested',
        aggregateType: 'appointment',
        aggregateId: appointment.id,
        context: { appointmentId: appointment.id },
      }),
    );
    await service.dispatch(later());
    expect(gateway.sent).toHaveLength(2);
    expect(await apiPrisma.pushDevice.count({ where: { token } })).toBe(0);
  });
});
