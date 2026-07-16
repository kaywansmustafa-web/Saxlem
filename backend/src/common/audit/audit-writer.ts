export interface AuditRecord {
  readonly organizationId?: string;
  readonly clinicId?: string;
  readonly actorId?: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId?: string;
  readonly outcome: 'succeeded' | 'denied' | 'failed';
  readonly requestId: string;
  readonly occurredAt: Date;
}

export interface AuditWriter {
  append(record: AuditRecord): Promise<void>;
}

export const AUDIT_WRITER = Symbol('AUDIT_WRITER');
