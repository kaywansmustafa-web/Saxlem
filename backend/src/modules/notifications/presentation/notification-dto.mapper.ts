import type { NotificationProjection } from '../domain/notification';
import type {
  NotificationItemDto,
  NotificationReadResponseDto,
} from './notification.dto';

export function mapNotification(
  value: NotificationProjection,
): NotificationItemDto {
  return {
    id: value.id,
    deliverySequence: value.sequence.toString(),
    type: value.type,
    priority: value.priority,
    actionCode: value.actionCode,
    occurredAt: value.occurredAt.toISOString(),
    createdAt: value.createdAt.toISOString(),
    readAt: value.readAt?.toISOString() ?? null,
  };
}

export function mapReadNotification(
  value: NotificationProjection,
): NotificationReadResponseDto {
  return { notification: mapNotification(value) };
}
