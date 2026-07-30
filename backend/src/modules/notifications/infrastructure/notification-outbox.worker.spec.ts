import type { BackendConfiguration } from '../../../config/environment';
import type { PrismaService } from '../../../infrastructure/database/prisma.service';
import { NotificationOutboxWorker } from './notification-outbox.worker';

describe('NotificationOutboxWorker lifecycle recovery', () => {
  it('survives retry-bookkeeping failure, processes later work, and shuts down promptly', async () => {
    const event = {
      id: '0198a4ae-0000-7000-8000-000000000010',
      eventType: 'queue.session.resumed',
      payload: {
        organizationId: '0198a4ae-0000-7000-8000-000000000011',
        clinicId: '0198a4ae-0000-7000-8000-000000000012',
        queueSessionId: '0198a4ae-0000-7000-8000-000000000013',
        queueEntryId: null,
      },
      occurredAt: new Date(),
      attempts: 0,
    };
    const notificationCreate = jest.fn().mockResolvedValue({ count: 1 });
    const publish = jest.fn().mockResolvedValue({});
    let transactionCalls = 0;
    const db = {
      $transaction: jest.fn(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          transactionCalls += 1;
          if (transactionCalls === 1)
            return callback({
              $queryRaw: jest.fn().mockResolvedValue([event]),
              queueSession: {
                findFirst: jest.fn().mockRejectedValue(new Error('projection')),
              },
            });
          if (transactionCalls === 2)
            return callback({
              $queryRaw: jest.fn().mockResolvedValue([event]),
              $executeRaw: jest.fn().mockResolvedValue(1),
              queueSession: {
                findFirst: jest.fn().mockResolvedValue({
                  doctorAssignment: {
                    status: 'active',
                    doctor: {
                      status: 'active',
                      staffAccount: {
                        user: {
                          id: '0198a4ae-0000-7000-8000-000000000014',
                          status: 'active',
                        },
                      },
                    },
                  },
                }),
              },
              clinicMembership: { findMany: jest.fn().mockResolvedValue([]) },
              queueEntry: { findMany: jest.fn().mockResolvedValue([]) },
              identityRoleAssignment: {
                findFirst: jest.fn().mockResolvedValue(null),
              },
              notificationRecord: { createMany: notificationCreate },
              outboxEvent: { update: publish },
            });
          return callback({ $queryRaw: jest.fn().mockResolvedValue([]) });
        },
      ),
      outboxEvent: {
        updateMany: jest
          .fn()
          .mockRejectedValueOnce(new Error('bookkeeping unavailable')),
      },
    };
    const worker = new NotificationOutboxWorker(
      { db } as unknown as PrismaService,
      {
        notificationWorkerEnabled: true,
        notificationWorkerTickLimit: 1,
        notificationWorkerPollIntervalMs: 5,
        notificationWorkerMaxAttempts: 3,
        notificationWorkerRetryBaseMs: 100,
        notificationWorkerRetryMaxMs: 1000,
      } as BackendConfiguration,
    );

    worker.onApplicationBootstrap();
    await new Promise((resolve) => setTimeout(resolve, 30));
    await worker.onApplicationShutdown();

    expect(transactionCalls).toBeGreaterThanOrEqual(2);
    expect(notificationCreate).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledTimes(1);
  });
});
