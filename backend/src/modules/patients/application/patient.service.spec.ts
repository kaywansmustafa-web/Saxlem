import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PatientService } from './patient.service';
import type {
  AccountRecord,
  PatientRepository,
  ProfileRecord,
} from '../domain/patient.repository';

const account: AccountRecord = {
  id: 'account',
  userId: 'user',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  activeProfileId: 'self',
};
const self: ProfileRecord = {
  id: 'self',
  patientAccountId: 'account',
  firstName: 'ژیان',
  lastName: 'Ahmed',
  dateOfBirth: new Date('1990-01-02'),
  gender: 'unspecified',
  relationship: 'self',
  status: 'active',
  version: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function repository(
  profiles: ProfileRecord[] = [self],
): jest.Mocked<PatientRepository> {
  return {
    accountForUser: jest.fn().mockResolvedValue(account),
    profiles: jest.fn().mockResolvedValue(profiles),
    profile: jest
      .fn()
      .mockImplementation((_account, id) =>
        Promise.resolve(profiles.find((profile) => profile.id === id) ?? null),
      ),
    create: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
    activate: jest.fn(),
  };
}

describe('PatientService', () => {
  it('projects self as me for Flutter compatibility', async () => {
    const service = new PatientService(repository());
    await expect(service.list('user')).resolves.toEqual([
      expect.objectContaining({ relationship: 'me', firstName: 'ژیان' }),
    ]);
  });

  it('requires the first profile to be Self and prevents a second Self', async () => {
    await expect(
      new PatientService(repository([])).create(
        'user',
        {
          firstName: 'A',
          lastName: 'B',
          dateOfBirth: '2000-01-01',
          gender: 'female',
          relationship: 'mother',
        },
        'request',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      new PatientService(repository()).create(
        'user',
        {
          firstName: 'A',
          lastName: 'B',
          dateOfBirth: '2000-01-01',
          gender: 'female',
          relationship: 'me',
        },
        'request',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('never archives Self', async () => {
    await expect(
      new PatientService(repository()).archive('user', 'self', 1, 'request'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects archived activation', async () => {
    const archived = {
      ...self,
      id: 'family',
      relationship: 'mother' as const,
      status: 'inactive' as const,
    };
    await expect(
      new PatientService(repository([self, archived])).activate(
        'user',
        'family',
        'request',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects optimistic-concurrency conflicts', async () => {
    const repo = repository();
    repo.update.mockResolvedValue(null);
    await expect(
      new PatientService(repo).update(
        'user',
        'self',
        {
          firstName: 'A',
          lastName: 'B',
          dateOfBirth: '2000-01-01',
          gender: 'male',
          version: 9,
        },
        'request',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
