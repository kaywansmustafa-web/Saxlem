import type { Response } from 'express';
import { EventEmitter } from 'node:events';
import type { BackendConfiguration } from '../../../config/environment';
import type { NotificationAccess } from '../domain/notification';
import type { NotificationRepository } from '../domain/notification.repository';
import { NotificationStreamService } from './notification-stream.service';

describe('NotificationStreamService', () => {
  const access: NotificationAccess = {
    actorId: '0198a4ae-0000-7000-8000-000000000001',
    sessionId: '0198a4ae-0000-7000-8000-000000000002',
    patient: true,
  };
  const configuration = {
    notificationSseMaxReconnectBacklog: 100,
    notificationSseMaxConnectionMs: 30000,
    notificationSsePageSize: 50,
    notificationSseHeartbeatIntervalMs: 15000,
    notificationSsePollIntervalMs: 1,
  } as BackendConfiguration;
  it('emits persisted notification frames strictly after the supplied sequence', async () => {
    const item = {
      id: '0198a4ae-0000-7000-8000-000000000003',
      patientProfileId: '0198a4ae-0000-7000-8000-000000000004',
      sequence: 8n,
      type: 'queue.patient.called',
      priority: 'high' as const,
      actionCode: 'queue.patient.called',
      occurredAt: new Date('2026-07-30T08:00:00.000Z'),
      createdAt: new Date('2026-07-30T08:00:01.000Z'),
      readAt: null,
    };
    const repository: jest.Mocked<NotificationRepository> = {
      list: jest
        .fn()
        .mockResolvedValueOnce({ items: [item], nextSequence: null }),
      markRead: jest.fn(),
      sequenceIsAccessible: jest.fn(),
      countAfter: jest.fn().mockResolvedValue(1),
    };
    const writes: string[] = [];
    const response = {
      destroyed: false,
      status: jest.fn(),
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn((value: string) => {
        writes.push(value);
        if (value.endsWith('\n\n')) response.destroyed = true;
        return true;
      }),
      once: jest.fn(),
      off: jest.fn(),
      end: jest.fn(),
    } as unknown as Response;
    const service = new NotificationStreamService(repository, configuration);

    await service.open(access, 7n, response);

    expect(repository.list.mock.calls[0]).toEqual([access, 7n, 50, false]);
    expect(writes.join('')).toContain('id: 8\n');
    expect(writes.join('')).toContain('event: notification\n');
    expect(writes.join('')).toContain('"deliverySequence":"8"');
  });

  it('pauses frame production until drain and resumes without polling ahead', async () => {
    const first = projection(8n);
    const second = projection(9n);
    const repository = repositoryWith([first, second]);
    const response = slowResponse();
    response.write.mockReturnValueOnce(false).mockImplementation(() => {
      response.destroyed = true;
      return true;
    });
    const service = new NotificationStreamService(repository, configuration);

    const opening = service.open(access, 7n, response as unknown as Response);
    await Promise.resolve();
    await Promise.resolve();
    expect(response.write).toHaveBeenCalledTimes(1);
    expect(repository.list.mock.calls).toHaveLength(1);
    response.emit('drain');
    await opening;
    expect(response.write).toHaveBeenCalledTimes(2);
  });

  it('terminates cleanly when a blocked client disconnects', async () => {
    const repository = repositoryWith([projection(8n)]);
    const response = slowResponse();
    response.write.mockReturnValue(false);
    const service = new NotificationStreamService(repository, configuration);

    const opening = service.open(access, 7n, response as unknown as Response);
    await Promise.resolve();
    response.destroyed = true;
    response.emit('close');
    await expect(opening).resolves.toBeUndefined();
    expect(repository.list.mock.calls).toHaveLength(1);
  });

  it('applies backpressure to heartbeat writes and expires blocked streams', async () => {
    const repository = repositoryWith([]);
    const response = slowResponse();
    response.write.mockReturnValue(false);
    const service = new NotificationStreamService(repository, {
      ...configuration,
      notificationSseHeartbeatIntervalMs: 0,
      notificationSseMaxConnectionMs: 20,
    });

    await service.open(access, null, response as unknown as Response);
    expect(response.write).toHaveBeenCalledWith(': heartbeat\n\n');
    expect(repository.list.mock.calls).toHaveLength(1);
    expect(response.end).toHaveBeenCalledTimes(1);
  });

  it('rejects recovery beyond the configured persisted backlog', async () => {
    const repository = {
      countAfter: jest.fn().mockResolvedValue(101),
    } as unknown as jest.Mocked<NotificationRepository>;
    const service = new NotificationStreamService(repository, {
      notificationSseMaxReconnectBacklog: 100,
    } as BackendConfiguration);
    await expect(
      service.open(
        {
          actorId: '0198a4ae-0000-7000-8000-000000000001',
          sessionId: '0198a4ae-0000-7000-8000-000000000002',
          patient: true,
        },
        null,
        {} as Response,
      ),
    ).rejects.toMatchObject({ status: 413 });
  });
});

function projection(sequence: bigint) {
  return {
    id: `0198a4ae-0000-7000-8000-${sequence.toString().padStart(12, '0')}`,
    patientProfileId: '0198a4ae-0000-7000-8000-000000000004',
    sequence,
    type: 'queue.patient.called',
    priority: 'high' as const,
    actionCode: 'queue.patient.called',
    occurredAt: new Date('2026-07-30T08:00:00.000Z'),
    createdAt: new Date('2026-07-30T08:00:01.000Z'),
    readAt: null,
  };
}

function repositoryWith(items: ReturnType<typeof projection>[]) {
  return {
    list: jest.fn().mockResolvedValue({ items, nextSequence: null }),
    markRead: jest.fn(),
    sequenceIsAccessible: jest.fn(),
    countAfter: jest.fn().mockResolvedValue(items.length),
  } as jest.Mocked<NotificationRepository>;
}

function slowResponse() {
  const emitter = new EventEmitter() as EventEmitter & {
    destroyed: boolean;
    writableEnded: boolean;
    status: jest.Mock;
    setHeader: jest.Mock;
    flushHeaders: jest.Mock;
    write: jest.Mock;
    end: jest.Mock;
  };
  emitter.destroyed = false;
  emitter.writableEnded = false;
  emitter.status = jest.fn();
  emitter.setHeader = jest.fn();
  emitter.flushHeaders = jest.fn();
  emitter.write = jest.fn();
  emitter.end = jest.fn(() => {
    emitter.writableEnded = true;
  });
  return emitter;
}
