import type {
  NotificationAccess,
  NotificationPage,
  NotificationProjection,
} from './notification';

export interface NotificationRepository {
  list(
    access: NotificationAccess,
    after: bigint | null,
    pageSize: number,
    unreadOnly: boolean,
  ): Promise<NotificationPage>;
  markRead(
    access: NotificationAccess,
    notificationId: string,
    idempotencyKey: string,
    requestId: string,
  ): Promise<NotificationProjection | null>;
  sequenceIsAccessible(
    access: NotificationAccess,
    sequence: bigint,
  ): Promise<boolean>;
  countAfter(access: NotificationAccess, after: bigint | null): Promise<number>;
}

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');
