import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { BackendConfiguration } from '../../../config/environment';
import type { QueueRepository } from '../domain/queue.repository';
import { QueueService } from './queue.service';

const repository = {
  operationalDate: jest.fn(),
  get: jest.fn(),
  getCurrent: jest.fn(),
  getPatientStatus: jest.fn(),
  listEntries: jest.fn(),
  open: jest.fn(),
  enqueue: jest.fn(),
  transitionSession: jest.fn(),
  callNext: jest.fn(),
  transitionEntry: jest.fn(),
} as jest.Mocked<QueueRepository>;
const configuration = {
  queueRecallGraceMinutes: 5,
  queueHealthBusyThresholdMinutes: 10,
  queueHealthDelayedThresholdMinutes: 25,
  queueFallbackConsultationMinutes: 20,
} as BackendConfiguration;
const staff = {
  actorId: 'actor',
  patient: false,
  doctor: false,
  platformAdministrator: false,
  organizationId: 'org',
  clinicId: 'clinic',
  capabilities: new Set(['queue:open']),
};

describe('QueueService authorization and command safety', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects mutation without its action capability', async () => {
    const service = new QueueService(repository, configuration);
    await expect(
      service.enqueue(
        staff,
        'session',
        'appointment',
        1,
        'valid-key',
        'request',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks platform administrators below the controller boundary', async () => {
    const service = new QueueService(repository, configuration);
    await expect(
      service.open(
        {
          ...staff,
          platformAdministrator: true,
          capabilities: new Set(['queue:open']),
        },
        'clinic',
        'doctor',
        1,
        'valid-key',
        'request',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('validates expected versions and idempotency keys', async () => {
    const service = new QueueService(repository, configuration);
    repository.operationalDate.mockResolvedValue(new Date('2026-07-29'));
    await expect(
      service.open(staff, 'clinic', 'doctor', 0, 'short', 'request'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('fails closed when doctor tenant context does not match the route clinic', async () => {
    const service = new QueueService(repository, configuration);
    await expect(
      service.current(
        {
          ...staff,
          doctor: true,
          capabilities: new Set(['queue:read']),
        },
        'another-clinic',
        'doctor',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.getCurrent.mock.calls).toHaveLength(0);
  });
});
