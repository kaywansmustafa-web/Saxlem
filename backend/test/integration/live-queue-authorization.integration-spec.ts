/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  apiPrisma,
  apiSideEffects,
  createApiTenant,
  createQueueApiApplication,
  createRolePrincipal,
  expectErrorEnvelope,
} from './live-queue-api-fixture';

const roles = [
  'unauthenticated',
  'patient',
  'receptionist',
  'doctor',
  'clinicManager',
  'platformAdministrator',
] as const;
const operations = [
  'open',
  'enqueue',
  'pause',
  'resume',
  'close',
  'call-next',
  'recall',
  'no-response',
  'start-consultation',
  'complete-consultation',
] as const;
type Role = (typeof roles)[number];
type Operation = (typeof operations)[number];

const granted: Record<
  Exclude<Role, 'unauthenticated'>,
  readonly Operation[]
> = {
  patient: [],
  receptionist: [
    'open',
    'enqueue',
    'pause',
    'resume',
    'close',
    'call-next',
    'recall',
    'no-response',
  ],
  doctor: [
    'open',
    'pause',
    'resume',
    'call-next',
    'start-consultation',
    'complete-consultation',
  ],
  clinicManager: operations,
  platformAdministrator: [],
};

describe('live queue HTTP authorization certification', () => {
  let app: INestApplication<App>;
  let tenant: Awaited<ReturnType<typeof createApiTenant>>;
  let foreign: Awaited<ReturnType<typeof createApiTenant>>;
  const principals = new Map<
    Exclude<Role, 'unauthenticated'>,
    Awaited<ReturnType<typeof createRolePrincipal>>
  >();

  beforeAll(async () => {
    app = await createQueueApiApplication();
    tenant = await createApiTenant('authorization');
    foreign = await createApiTenant('authorization-foreign');
    for (const role of roles) {
      if (role !== 'unauthenticated')
        principals.set(role, await createRolePrincipal(role, tenant));
    }
  });

  afterAll(async () => {
    await app.close();
    await apiPrisma.$disconnect();
  });

  it.each(
    roles.flatMap((role) =>
      operations.map((operation) => ({ role, operation })),
    ),
  )(
    '$role × $operation enforces the approved mutation policy',
    async ({ role, operation }) => {
      const before = await apiSideEffects();
      const response = await mutationRequest(
        app.getHttpServer(),
        tenant,
        principals.get(role as Exclude<Role, 'unauthenticated'>)?.token,
        operation,
      );
      const expected =
        role === 'unauthenticated'
          ? 401
          : granted[role].includes(operation)
            ? 404
            : 403;
      expect(response.status).toBe(expected);
      expectErrorEnvelope(response.body, expected);
      expect(await apiSideEffects()).toEqual(before);
    },
  );

  it('proves all 60 role-operation pairs are represented exactly once', () => {
    const pairs = roles.flatMap((role) =>
      operations.map((operation) => `${role}:${operation}`),
    );
    expect(pairs).toHaveLength(60);
    expect(new Set(pairs).size).toBe(60);
  });

  it('rejects receptionist token organization and clinic mismatches with 403 and no effects', async () => {
    const receptionist = principals.get('receptionist')!;
    const before = await apiSideEffects();
    for (const [header, value] of [
      ['x-organization-id', foreign.organizationId],
      ['x-clinic-id', foreign.clinicId],
    ] as const) {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/queue-sessions/${randomUUID()}/pause`)
        .set('Authorization', `Bearer ${receptionist.token}`)
        .set(header, value)
        .set('Idempotency-Key', `mismatch-${header}`)
        .send({ version: 1 });
      expect(response.status).toBe(403);
      expectErrorEnvelope(response.body, 403);
    }
    expect(await apiSideEffects()).toEqual(before);
  });

  it('privacy-hides foreign clinic, same-doctor foreign clinic, and other-doctor routes', async () => {
    const doctor = principals.get('doctor')!;
    const before = await apiSideEffects();
    for (const [clinicId, doctorId] of [
      [foreign.clinicId, doctor.doctorId!],
      [tenant.clinicId, randomUUID()],
    ]) {
      const response = await request(app.getHttpServer())
        .post(
          `/api/v1/clinics/${clinicId}/doctors/${doctorId}/queue-sessions/open`,
        )
        .set('Authorization', `Bearer ${doctor.token}`)
        .set('Idempotency-Key', `doctor-scope-${randomUUID()}`)
        .send({ version: 1 });
      expect(response.status).toBe(404);
      expectErrorEnvelope(response.body, 404);
    }
    expect(await apiSideEffects()).toEqual(before);
  });

  it('rejects inactive staff membership before repository access', async () => {
    const manager = principals.get('clinicManager')!;
    await apiPrisma.clinicMembership.updateMany({
      where: { userId: manager.userId },
      data: { status: 'inactive' },
    });
    const before = await apiSideEffects();
    const response = await request(app.getHttpServer())
      .post(`/api/v1/queue-sessions/${randomUUID()}/pause`)
      .set('Authorization', `Bearer ${manager.token}`)
      .set('Idempotency-Key', 'inactive-membership')
      .send({ version: 1 });
    expect(response.status).toBe(403);
    expectErrorEnvelope(response.body, 403);
    expect(await apiSideEffects()).toEqual(before);
  });

  it.each(['receptionist', 'clinicManager'] as const)(
    'privacy-hides a valid foreign tenant from %s',
    async (role) => {
      const principal = principals.get(role)!;
      const foreignDoctor = await createRolePrincipal('doctor', foreign);
      const before = await apiSideEffects();
      const response = await request(app.getHttpServer())
        .post(
          `/api/v1/clinics/${foreign.clinicId}/doctors/${foreignDoctor.doctorId}/queue-sessions/open`,
        )
        .set('Authorization', `Bearer ${principal.token}`)
        .set('Idempotency-Key', `foreign-tenant-${role}`)
        .send({ version: 1 });
      const expected = role === 'clinicManager' ? 403 : 404;
      expect(response.status).toBe(expected);
      expectErrorEnvelope(response.body, expected);
      expect(await apiSideEffects()).toEqual(before);
    },
  );

  it('privacy-hides inactive doctor assignment and nested clinic/doctor mismatches', async () => {
    const doctor = principals.get('doctor')!;
    const foreignDoctor = await createRolePrincipal('doctor', foreign);
    const before = await apiSideEffects();
    const nested = await request(app.getHttpServer())
      .post(
        `/api/v1/clinics/${tenant.clinicId}/doctors/${foreignDoctor.doctorId}/queue-sessions/open`,
      )
      .set('Authorization', `Bearer ${doctor.token}`)
      .set('Idempotency-Key', 'nested-doctor-mismatch')
      .send({ version: 1 });
    expect(nested.status).toBe(404);
    expectErrorEnvelope(nested.body, 404);
    await apiPrisma.doctorClinicAssignment.updateMany({
      where: { doctorId: doctor.doctorId! },
      data: { status: 'inactive' },
    });
    const inactive = await request(app.getHttpServer())
      .post(
        `/api/v1/clinics/${tenant.clinicId}/doctors/${doctor.doctorId}/queue-sessions/open`,
      )
      .set('Authorization', `Bearer ${doctor.token}`)
      .set('Idempotency-Key', 'inactive-assignment')
      .send({ version: 1 });
    expect(inactive.status).toBe(404);
    expectErrorEnvelope(inactive.body, 404);
    expect(await apiSideEffects()).toEqual(before);
  });
});

function mutationRequest(
  server: Parameters<typeof request>[0],
  tenant: Awaited<ReturnType<typeof createApiTenant>>,
  token: string | undefined,
  operation: Operation,
) {
  const sessionId = randomUUID();
  const entryId = randomUUID();
  const doctorId = randomUUID();
  const path =
    operation === 'open'
      ? `/api/v1/clinics/${tenant.clinicId}/doctors/${doctorId}/queue-sessions/open`
      : operation === 'enqueue'
        ? `/api/v1/queue-sessions/${sessionId}/enqueue`
        : [
              'recall',
              'no-response',
              'start-consultation',
              'complete-consultation',
            ].includes(operation)
          ? `/api/v1/queue-sessions/${sessionId}/entries/${entryId}/${operation}`
          : `/api/v1/queue-sessions/${sessionId}/${operation}`;
  let pending = request(server)
    .post(path)
    .set('Idempotency-Key', `matrix-${operation}-${randomUUID()}`);
  if (token) pending = pending.set('Authorization', `Bearer ${token}`);
  return pending.send(
    operation === 'enqueue'
      ? { appointmentId: randomUUID(), version: 1 }
      : [
            'recall',
            'no-response',
            'start-consultation',
            'complete-consultation',
          ].includes(operation)
        ? { sessionVersion: 1, entryVersion: 1 }
        : { version: 1 },
  );
}
