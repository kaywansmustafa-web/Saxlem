import type { PatientQueueStatus, QueueSnapshot } from '../domain/queue';
import { mapPatientQueue, mapStaffQueue } from './queue-dto.mapper';

describe('queue presentation privacy allowlists', () => {
  it('does not leak persistence or patient identity fields in staff summaries', () => {
    const response = mapStaffQueue(snapshot());
    expect(Object.keys(response).sort()).toEqual(
      [
        'currentPatient',
        'id',
        'status',
        'updatedAt',
        'version',
        'waitingCount',
      ].sort(),
    );
    expect(JSON.stringify(response)).not.toMatch(
      /organizationId|patientProfileId|patientName|appointmentId/,
    );
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
        'currentTicket',
        'doctor',
        'estimateSuspended',
        'estimatedWait',
        'instruction',
        'lastUpdatedAt',
        'patientsAhead',
        'queueHealth',
        'queueState',
        'status',
        'ticketNumber',
      ].sort(),
    );
  });
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
      appointmentId: 'appointment-storage-id',
      appointmentReference: 'SAX-TEST',
      patientProfileId: 'patient-storage-id',
      patientName: 'Private Patient',
      ticketNumber: 1,
      status: 'called',
      version: 2,
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
