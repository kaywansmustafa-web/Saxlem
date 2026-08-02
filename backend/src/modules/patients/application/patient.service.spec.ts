import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import type { BackendConfiguration } from '../../../config/environment';
import { PatientAuditPersistenceError } from '../domain/patient.errors';
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
const configuration = {
  auditHashSecret: 'patient-directory-test-secret-at-least-32-characters',
} as BackendConfiguration;
const service = (repo = repository()) =>
  new PatientService(repo, configuration);

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
    searchDirectory: jest.fn(),
    getDirectoryProfile: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
    activate: jest.fn(),
  };
}

describe('PatientService', () => {
  it('projects self as me for Flutter compatibility', async () => {
    await expect(service().list('user')).resolves.toEqual([
      expect.objectContaining({ relationship: 'me', firstName: 'ژیان' }),
    ]);
  });

  it('requires the first profile to be Self and prevents a second Self', async () => {
    await expect(
      service(repository([])).create(
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
      service().create(
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
      service().archive('user', 'self', 1, 'request'),
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
      service(repository([self, archived])).activate(
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
      service(repo).update(
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

  it('validates staff-directory searches and trims the query', async () => {
    const repo = repository();
    repo.searchDirectory.mockResolvedValue({ items: [], nextCursor: null });
    const patientService = service(repo);
    await expect(
      patientService.searchDirectory(
        { actorId: 'actor', organizationId: 'org', clinicId: 'clinic' },
        { q: 'a', pageSize: 10 },
        'request-id',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      patientService.searchDirectory(
        { actorId: 'actor', organizationId: 'org', clinicId: 'clinic' },
        { q: '  Ali  ', pageSize: 10 },
        'request-id',
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        items: [],
        nextCursor: null,
      }),
    );
  });

  it('surfaces audit failures for directory views', async () => {
    const repo = repository();
    repo.getDirectoryProfile.mockRejectedValue(
      new PatientAuditPersistenceError(),
    );
    await expect(
      service(repo).getDirectoryProfile(
        { actorId: 'actor', organizationId: 'org', clinicId: 'clinic' },
        'profile-1',
        'request-id',
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('signs cursors and binds them to query, page size, organization, and clinic', async () => {
    const repo = repository();
    repo.searchDirectory.mockResolvedValueOnce({
      items: [],
      nextCursor: {
        organizationId: 'org',
        clinicId: 'clinic',
        query: 'Ali',
        pageSize: 10,
        lastName: 'ahmed',
        firstName: 'ali',
        profileId: '11111111-1111-4111-8111-111111111111',
      },
    });
    const first = await service(repo).searchDirectory(
      { actorId: 'actor', organizationId: 'org', clinicId: 'clinic' },
      { q: 'Ali', pageSize: 10 },
      'request-id',
    );
    expect(first.nextCursor).toEqual(expect.any(String));

    repo.searchDirectory.mockResolvedValue({ items: [], nextCursor: null });
    await service(repo).searchDirectory(
      { actorId: 'actor', organizationId: 'org', clinicId: 'clinic' },
      { q: 'Ali', pageSize: 10, cursor: first.nextCursor! },
      'request-id',
    );
    expect(repo.searchDirectory.mock.calls.at(-1)).toEqual([
      expect.anything(),
      { q: 'Ali', pageSize: 10 },
      expect.objectContaining({
        lastName: 'ahmed',
        profileId: '11111111-1111-4111-8111-111111111111',
      }),
      'request-id',
    ]);

    for (const input of [
      { q: 'Other', pageSize: 10, cursor: first.nextCursor! },
      { q: 'Ali', pageSize: 11, cursor: first.nextCursor! },
    ]) {
      await expect(
        service(repo).searchDirectory(
          { actorId: 'actor', organizationId: 'org', clinicId: 'clinic' },
          input,
          'request-id',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
    const [payload, signature] = first.nextCursor!.split('.');
    expect(payload).toBeDefined();
    expect(signature).toBeDefined();
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        ...JSON.parse(Buffer.from(payload!, 'base64url').toString('utf8')),
        profileId: '22222222-2222-4222-8222-222222222222',
      }),
    ).toString('base64url');
    await expect(
      service(repo).searchDirectory(
        { actorId: 'actor', organizationId: 'org', clinicId: 'clinic' },
        { q: 'Ali', pageSize: 10, cursor: `${tamperedPayload}.${signature!}` },
        'request-id',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not misreport ordinary repository failures as audit failures', async () => {
    const repo = repository();
    const failure = new Error('database unavailable');
    repo.getDirectoryProfile.mockRejectedValue(failure);
    await expect(
      service(repo).getDirectoryProfile(
        { actorId: 'actor', organizationId: 'org', clinicId: 'clinic' },
        '11111111-1111-4111-8111-111111111111',
        'request-id',
      ),
    ).rejects.toBe(failure);
  });
});
