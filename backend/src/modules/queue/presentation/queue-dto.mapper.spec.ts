import type {
  PatientQueueStatus,
  QueueEnqueueResult,
  QueueSnapshot,
} from '../domain/queue';
import {
  mapEnqueueResult,
  mapPatientQueue,
  mapQueueEntries,
  mapStaffQueue,
} from './queue-dto.mapper';

describe('queue presentation privacy allowlists', () => {
  it('maps the explicit safe staff entry allowlist', () => {
    const response = mapStaffQueue(snapshot());
    expect(Object.keys(response).sort()).toEqual(
      [
        'currentPatient',
        'effectiveTimezone',
        'id',
        'operationalDate',
        'status',
        'updatedAt',
        'version',
        'waitingCount',
      ].sort(),
    );
    expect(Object.keys(response.currentPatient!).sort()).toEqual(
      staffEntryKeys,
    );
    expect(response.currentPatient).toMatchObject({
      entryId: 'entry-storage-id',
      queueSessionId: 'session-storage-id',
      appointmentId: 'appointment-storage-id',
      appointmentReference: 'SAX-TEST',
      patientProfileId: 'patient-storage-id',
      patientDisplayName: 'Private Patient',
    });
    expect(JSON.stringify(response)).not.toMatch(
      /phone|dateOfBirth|reason|clinical|address|patientName/,
    );
  });

  it('uses the staff DTO for entry pages and enqueue results', () => {
    const value = snapshot();
    const page = mapQueueEntries({ items: [value.current!], nextCursor: null });
    expect(Object.keys(page.items[0]!).sort()).toEqual(staffEntryKeys);
    const enqueue = mapEnqueueResult({
      ...value,
      enqueuedEntry: value.current!,
    } satisfies QueueEnqueueResult);
    expect(Object.keys(enqueue)).toEqual(['entry', 'queue']);
    expect(enqueue.entry.entryId).toBe('entry-storage-id');
    expect(enqueue.entry.ticketNumber).toBe(1);
    expect(enqueue.queue.id).toBe('session-storage-id');
  });

  it('maps exactly the approved patient contract', () => {
    const response = mapPatientQueue({
      queueState: 'open',
      ticketNumber: 2,
      currentTicket: 1,
      patientsAhead: 1,
      estimatedWait: { minimumMinutes: 10, maximumMinutes: 20 },
      estimateSuspended: false,
      queueHealth: 'healthy',
      doctor: { id: 'public-doctor', name: 'Dr. Test' },
      clinic: { id: 'public-clinic', name: 'Clinic' },
      appointmentReference: 'SAX-TEST',
      status: 'waiting',
      instruction: 'Please stay nearby.',
      lastUpdatedAt: '2031-01-01T00:00:00.000Z',
    } satisfies PatientQueueStatus);
    expect(Object.keys(response).sort()).toEqual(
      [
        'appointmentReference',
        'clinic',
        'currentTicketNumber',
        'doctor',
        'estimateSuspended',
        'estimatedWait',
        'instruction',
        'updatedAt',
        'patientsAhead',
        'queueHealth',
        'queueState',
        'patientEntryStatus',
        'ticketNumber',
      ].sort(),
    );
  });

  it.each([
    'notEnqueued',
    'waiting',
    'called',
    'noResponse',
    'inConsultation',
    'completed',
    'removed',
  ] as const)(
    'maps patient entry status %s without identity fields',
    (status) => {
      const response = mapPatientQueue({
        queueState: 'notStarted',
        ticketNumber: status === 'notEnqueued' ? null : 2,
        currentTicket: null,
        patientsAhead: 0,
        estimatedWait: null,
        estimateSuspended: false,
        queueHealth: status === 'notEnqueued' ? null : 'healthy',
        doctor: { id: 'public-doctor', name: 'Dr. Test' },
        clinic: { id: 'public-clinic', name: 'Clinic' },
        appointmentReference: 'SAX-TEST',
        status,
        instruction: 'Please wait.',
        lastUpdatedAt: '2031-01-01T00:00:00.000Z',
      } satisfies PatientQueueStatus);
      expect(response.patientEntryStatus).toBe(status);
      expect(response.ticketNumber).toBe(status === 'notEnqueued' ? null : 2);
      expect(JSON.stringify(response)).not.toMatch(
        /patientName|patientProfileId|appointmentId/,
      );
    },
  );
});

function snapshot(): QueueSnapshot {
  return {
    id: 'session-storage-id',
    organizationId: 'organization-storage-id',
    clinic: { id: 'clinic-public-id', name: 'Clinic' },
    doctor: { id: 'doctor-public-id', name: 'Doctor' },
    operationalDate: '2031-01-01',
    effectiveTimezone: 'Asia/Baghdad',
    status: 'open',
    version: 2,
    waitingCount: 1,
    current: {
      id: 'entry-storage-id',
      queueSessionId: 'session-storage-id',
      appointmentId: 'appointment-storage-id',
      appointmentReference: 'SAX-TEST',
      patientProfileId: 'patient-storage-id',
      patientName: 'Private Patient',
      ticketNumber: 1,
      status: 'called',
      version: 2,
      enqueuedAt: '2031-01-01T00:00:00.000Z',
      calledAt: null,
      consultationStartedAt: null,
      completedAt: null,
      noResponseAt: null,
    },
    waiting: [],
    recentActivity: [],
    openedAt: null,
    pausedAt: null,
    closedAt: null,
    pauseReason: null,
    updatedAt: '2031-01-01T00:00:00.000Z',
  };
}

const staffEntryKeys = [
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
].sort();
