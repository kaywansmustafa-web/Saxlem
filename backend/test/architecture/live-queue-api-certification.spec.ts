import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Operation = {
  parameters?: Array<{
    name?: string;
    required?: boolean;
    schema?: {
      type?: string;
      minLength?: number;
      maxLength?: number;
      minimum?: number;
      maximum?: number;
      default?: unknown;
    };
  }>;
  responses?: Record<string, { content?: object }>;
  requestBody?: { content?: Record<string, { schema?: object }> };
};
type Schema = {
  type?: string;
  format?: string;
  nullable?: boolean;
  minimum?: number;
  properties?: Record<string, Schema>;
  required?: string[];
  $ref?: string;
  allOf?: Schema[];
};

describe('live queue OpenAPI certification manifest', () => {
  const source = (path: string) =>
    readFileSync(join(process.cwd(), path), 'utf8');
  const document = JSON.parse(source('openapi/saxlem-api.json')) as {
    paths: Record<string, Record<string, Operation>>;
    components: { schemas: Record<string, object> };
  };
  const queuePaths = Object.entries(document.paths).filter(([path]) =>
    path.includes('queue'),
  );

  it('keeps every product queue route under /api/v1 and exposes no generic PATCH', () => {
    expect(queuePaths.length).toBeGreaterThanOrEqual(14);
    for (const [path, operations] of queuePaths) {
      expect(path.startsWith('/api/v1/')).toBe(true);
      expect(operations.patch).toBeUndefined();
    }
  });

  it('exposes patient queue status as read-only', () => {
    const path =
      document.paths['/api/v1/appointments/{appointmentId}/queue-status'];
    expect(path?.get).toBeDefined();
    for (const method of ['post', 'put', 'patch', 'delete'])
      expect(path?.[method]).toBeUndefined();
  });

  it('documents idempotency on every mutation and never on GET', () => {
    for (const [, operations] of queuePaths) {
      for (const [method, operation] of Object.entries(operations)) {
        const header = operation.parameters?.find(
          ({ name }) => name === 'Idempotency-Key',
        );
        if (method === 'post') {
          expect(header).toMatchObject({
            required: true,
            schema: { minLength: 8, maxLength: 128 },
          });
        } else if (method === 'get') {
          expect(header).toBeUndefined();
        }
      }
    }
  });

  it('documents the complete standard response envelope set', () => {
    for (const [, operations] of queuePaths) {
      for (const operation of Object.values(operations)) {
        expect(Object.keys(operation.responses ?? {})).toEqual(
          expect.arrayContaining([
            '200',
            '400',
            '401',
            '403',
            '404',
            '409',
            '429',
            '500',
            '503',
          ]),
        );
      }
    }
  });

  it('keeps patient, staff, entry, pagination, and error schemas separate', () => {
    for (const name of [
      'PatientQueueStatusResponseDto',
      'QueueResponseDto',
      'StaffQueueEntryResponseDto',
      'QueueEnqueueResponseDto',
      'QueueEntriesPageResponseDto',
      'ApiErrorEnvelopeDto',
    ])
      expect(document.components.schemas[name]).toBeDefined();
    const page = document.components.schemas.QueueEntriesPageResponseDto as {
      properties?: Record<string, object>;
    };
    expect(page.properties?.nextCursor).toBeDefined();
  });

  it('documents queue pagination query parameters as bounded scalars', () => {
    const operation =
      document.paths['/api/v1/queue-sessions/{id}/entries']?.get;
    const pageSize = operation?.parameters?.find(
      ({ name }) => name === 'pageSize',
    );
    const includeTerminal = operation?.parameters?.find(
      ({ name }) => name === 'includeTerminal',
    );
    expect(pageSize?.schema).toMatchObject({
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
    });
    expect(includeTerminal?.schema).toMatchObject({
      type: 'boolean',
      default: false,
    });
  });

  it('keeps queue response schemas identical to runtime allowlists', () => {
    const schemas = document.components.schemas as Record<string, Schema>;
    const page = schemas.QueueEntriesPageResponseDto!;
    const patient = schemas.PatientQueueStatusResponseDto!;
    const staff = schemas.QueueResponseDto!;
    const staffEntry = schemas.StaffQueueEntryResponseDto!;
    const enqueue = schemas.QueueEnqueueResponseDto!;
    const doctor = schemas.QueueDoctorReferenceResponseDto!;
    const clinic = schemas.QueueClinicReferenceResponseDto!;

    expect(
      document.paths['/api/v1/queue-sessions/{id}/entries']?.get?.responses?.[
        '200'
      ],
    ).toMatchObject({
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/QueueEntriesPageResponseDto',
          },
        },
      },
    });
    expect(
      document.paths['/api/v1/queue-sessions/{id}/enqueue']?.post?.responses?.[
        '200'
      ],
    ).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/QueueEnqueueResponseDto' },
        },
      },
    });
    expect(page.properties?.items).toMatchObject({
      type: 'array',
      items: { $ref: '#/components/schemas/StaffQueueEntryResponseDto' },
    });

    expect(page.properties?.nextCursor).toMatchObject({
      type: 'string',
      nullable: true,
    });
    expect(patient.properties?.currentTicketNumber).toMatchObject({
      type: 'integer',
      nullable: true,
      minimum: 1,
    });
    expect(patient.properties?.ticketNumber).toMatchObject({
      type: 'integer',
      nullable: true,
      minimum: 1,
    });
    expect(patient.properties?.patientsAhead).toMatchObject({
      type: 'integer',
      minimum: 0,
    });
    expect(patient.properties?.queueHealth).toMatchObject({
      type: 'string',
      nullable: true,
      enum: ['healthy', 'busy', 'delayed'],
    });
    expect(patient.properties?.patientEntryStatus).toMatchObject({
      type: 'string',
      enum: [
        'notEnqueued',
        'waiting',
        'called',
        'inConsultation',
        'completed',
        'noResponse',
        'removed',
      ],
    });
    expect(patient.properties?.updatedAt).toMatchObject({
      type: 'string',
      format: 'date-time',
    });
    expect(staff.properties?.currentPatient).toMatchObject({
      nullable: true,
      allOf: [{ $ref: '#/components/schemas/StaffQueueEntryResponseDto' }],
    });
    expect(enqueue.properties?.entry).toMatchObject({
      $ref: '#/components/schemas/StaffQueueEntryResponseDto',
    });
    expect(enqueue.properties?.queue).toMatchObject({
      $ref: '#/components/schemas/QueueResponseDto',
    });
    expect(Object.keys(staffEntry.properties ?? {}).sort()).toEqual(
      [
        'appointmentId',
        'appointmentReference',
        'calledAt',
        'completedAt',
        'consultationStartedAt',
        'enqueuedAt',
        'entryId',
        'noResponseAt',
        'patientDisplayName',
        'patientProfileId',
        'queueSessionId',
        'status',
        'ticketNumber',
        'version',
      ].sort(),
    );
    expect(staff.properties?.operationalDate).toMatchObject({
      type: 'string',
      format: 'date',
    });
    expect(staff.properties?.effectiveTimezone).toMatchObject({
      type: 'string',
    });
    for (const identifier of [
      'entryId',
      'queueSessionId',
      'appointmentId',
      'patientProfileId',
    ])
      expect(staffEntry.properties?.[identifier]).toMatchObject({
        type: 'string',
        format: 'uuid',
      });
    for (const scalar of ['ticketNumber', 'version'])
      expect(staffEntry.properties?.[scalar]).toMatchObject({
        type: 'integer',
        minimum: 1,
      });
    for (const timestamp of [
      'calledAt',
      'consultationStartedAt',
      'completedAt',
      'noResponseAt',
    ])
      expect(staffEntry.properties?.[timestamp]).toMatchObject({
        type: 'string',
        format: 'date-time',
        nullable: true,
      });
    expect(JSON.stringify(staffEntry)).not.toMatch(
      /phone|dateOfBirth|reason|clinical|address|#\/components\/schemas\/Object/,
    );
    expect(patient.properties?.doctor).toMatchObject({
      $ref: '#/components/schemas/QueueDoctorReferenceResponseDto',
    });
    expect(patient.properties?.clinic).toMatchObject({
      $ref: '#/components/schemas/QueueClinicReferenceResponseDto',
    });
    for (const reference of [doctor, clinic]) {
      expect(Object.keys(reference.properties ?? {}).sort()).toEqual([
        'id',
        'name',
      ]);
      expect(reference.required?.sort()).toEqual(['id', 'name']);
      expect(reference.properties?.id).toMatchObject({
        type: 'string',
        format: 'uuid',
      });
      expect(reference.properties?.name).toMatchObject({ type: 'string' });
    }
    for (const field of [
      page.properties?.nextCursor,
      patient.properties?.currentTicketNumber,
      staff.properties?.currentPatient,
      patient.properties?.doctor,
      patient.properties?.clinic,
    ])
      expect(JSON.stringify(field)).not.toContain(
        '#/components/schemas/Object',
      );
  });

  it('proves every required API certification category has a focused suite', () => {
    const required = [
      'test/integration/live-queue-authorization.integration-spec.ts',
      'test/integration/live-queue-api-contract.integration-spec.ts',
      'test/integration/live-queue-hardening.integration-spec.ts',
      'test/integration/live-queue-pagination.integration-spec.ts',
      'test/integration/live-queue-privacy.integration-spec.ts',
      'test/architecture/live-queue-api-certification.spec.ts',
    ];
    for (const path of required) expect(source(path).length).toBeGreaterThan(0);
  });

  it('pins UUIDv7 model defaults and the documented PostgreSQL function fallback', () => {
    const schema = source('prisma/schema.prisma');
    const commandMigration = source(
      'prisma/migrations/20260729124000_live_queue_runtime_command_ids/migration.sql',
    );
    expect(schema).toMatch(
      /model QueueSession \{[\s\S]*?@default\(uuid\(7\)\)/,
    );
    expect(schema).toMatch(/model QueueEntry \{[\s\S]*?@default\(uuid\(7\)\)/);
    expect(commandMigration).toContain('safe built-in random UUID fallback');
    expect(commandMigration).toContain('gen_random_uuid()');
  });
});
