import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { BackendConfiguration } from '../../../config/environment';
import type { NotificationAccess } from '../domain/notification';
import type { NotificationRepository } from '../domain/notification.repository';
import { NotificationService } from './notification.service';

const access: NotificationAccess = {
  actorId: '0198a4ae-0000-7000-8000-000000000001',
  sessionId: '0198a4ae-0000-7000-8000-000000000002',
  patient: true,
};

const item = {
  id: '0198a4ae-0000-7000-8000-000000000003',
  patientProfileId: '0198a4ae-0000-7000-8000-000000000004',
  sequence: 7n,
  type: 'queue.patient.called',
  priority: 'high' as const,
  actionCode: 'queue.patient.called',
  occurredAt: new Date('2026-07-30T08:00:00.000Z'),
  createdAt: new Date('2026-07-30T08:00:01.000Z'),
  readAt: null,
};

function repository(): jest.Mocked<NotificationRepository> {
  return {
    list: jest.fn().mockResolvedValue({ items: [item], nextSequence: 7n }),
    markRead: jest.fn().mockResolvedValue(item),
    sequenceIsAccessible: jest.fn().mockResolvedValue(true),
    countAfter: jest.fn().mockResolvedValue(0),
  };
}

describe('NotificationService', () => {
  const configuration = {
    auditHashSecret: 'notification-test-audit-secret-32-characters',
  } as BackendConfiguration;

  it('creates a signed, session-bound stable cursor', async () => {
    const repo = repository();
    const service = new NotificationService(repo, configuration);
    const first = await service.list(access, undefined, 25, false);
    expect(first.nextCursor).toBeTruthy();
    await service.list(access, first.nextCursor!, 25, false);
    expect(repo.list.mock.calls.at(-1)).toEqual([access, 7n, 25, false]);
  });

  it('rejects cursor payload, signature, and session tampering', async () => {
    const repo = repository();
    const service = new NotificationService(repo, configuration);
    const cursor = (await service.list(access, undefined, 25, false))
      .nextCursor!;
    const [payload, signature] = cursor.split('.');
    const decoded = JSON.parse(
      Buffer.from(payload!, 'base64url').toString('utf8'),
    ) as Record<string, string>;
    decoded.sequence = '8';
    const changed = Buffer.from(JSON.stringify(decoded)).toString('base64url');
    await expect(
      service.list(access, `${changed}.${signature!}`, 25, false),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.list(
        access,
        `${payload!}.${signature!.slice(0, -1)}0`,
        25,
        false,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.list(
        { ...access, sessionId: `${access.sessionId}-foreign` },
        cursor,
        25,
        false,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('validates Last-Event-ID ownership before streaming', async () => {
    const repo = repository();
    const service = new NotificationService(repo, configuration);
    await expect(service.parseLastEventId(access, '7')).resolves.toBe(7n);
    repo.sequenceIsAccessible.mockResolvedValue(false);
    await expect(service.parseLastEventId(access, '7')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.parseLastEventId(access, '-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('requires an idempotency key and preserves privacy-safe not found', async () => {
    const repo = repository();
    const service = new NotificationService(repo, configuration);
    await expect(
      service.markRead(access, item.id, 'short', 'request'),
    ).rejects.toBeInstanceOf(BadRequestException);
    repo.markRead.mockResolvedValue(null);
    await expect(
      service.markRead(access, item.id, 'valid-key', 'request'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
