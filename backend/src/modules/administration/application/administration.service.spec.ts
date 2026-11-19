/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { BackendConfiguration } from '../../../config/environment';
import type { AdministrationRepository } from '../domain/administration.repository';
import { AdministrationService } from './administration.service';

const now = new Date('2026-08-10T10:00:00.000Z');
const organization = Object.freeze({
  id: '018f0000-0000-7000-8000-000000000001',
  name: 'Saxlem',
  status: 'active' as const,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
});
const clinic = Object.freeze({
  id: '018f0000-0000-7000-8000-000000000002',
  organizationId: organization.id,
  name: 'Duhok',
  code: 'DUHOK_1',
  timezone: 'Asia/Baghdad',
  status: 'active' as const,
  address: null,
  area: null,
  city: null,
  latitude: null,
  longitude: null,
  phoneNumber: null,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
});

describe('AdministrationService', () => {
  const repository: jest.Mocked<AdministrationRepository> = {
    createOrganization: jest.fn(),
    listOrganizations: jest.fn(),
    organization: jest.fn(),
    createClinic: jest.fn(),
    listClinics: jest.fn(),
    clinic: jest.fn(),
    updateClinicLocation: jest.fn(),
  };
  const configuration = {
    auditHashSecret: 'administration-test-secret-with-sufficient-length',
  } as BackendConfiguration;
  const service = new AdministrationService(repository, configuration);
  const access = { actorId: '018f0000-0000-7000-8000-000000000003' };

  beforeEach(() => jest.clearAllMocks());

  it('normalizes creation inputs and binds idempotency to request content', async () => {
    repository.createOrganization.mockResolvedValue(organization);
    repository.createClinic.mockResolvedValue(clinic);
    await service.createOrganization(
      access,
      '  Saxlem  ',
      'request',
      'operation-organization',
    );
    await service.createClinic(
      access,
      {
        organizationId: organization.id,
        name: ' Duhok ',
        code: ' duhok_1 ',
        timezone: ' Asia/Baghdad ',
      },
      'request',
      'operation-clinic',
    );
    expect(repository.createOrganization).toHaveBeenCalledWith(
      access,
      'Saxlem',
      'request',
      expect.objectContaining({
        scope: 'administration.organization.create',
        hash: expect.any(String),
      }),
    );
    expect(repository.createClinic).toHaveBeenCalledWith(
      access,
      {
        organizationId: organization.id,
        name: 'Duhok',
        code: 'DUHOK_1',
        timezone: 'Asia/Baghdad',
      },
      'request',
      expect.objectContaining({ scope: 'administration.clinic.create' }),
    );
  });

  it('rejects unsafe idempotency keys and invalid timezones', async () => {
    expect(() =>
      service.createOrganization(access, 'Saxlem', 'request', 'short'),
    ).toThrow(BadRequestException);
    expect(() =>
      service.createClinic(
        access,
        {
          organizationId: organization.id,
          name: 'Duhok',
          code: 'DHK',
          timezone: 'Invalid/Nowhere',
        },
        'request',
        'operation-clinic',
      ),
    ).toThrow(BadRequestException);
  });

  it('creates signed actor/filter/page-bound cursors and rejects tampering', async () => {
    repository.listOrganizations.mockResolvedValue({
      items: [organization],
      next: { createdAt: now, id: organization.id },
    });
    const first = await service.organizations(access, { pageSize: 10 });
    expect(first.nextCursor).toEqual(expect.any(String));
    repository.listOrganizations.mockResolvedValue({ items: [], next: null });
    await expect(
      service.organizations(access, {
        pageSize: 10,
        cursor: first.nextCursor!,
      }),
    ).resolves.toEqual({ items: [], nextCursor: null });
    await expect(
      service.organizations(
        { actorId: clinic.id },
        { pageSize: 10, cursor: first.nextCursor! },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.organizations(access, {
        pageSize: 11,
        cursor: first.nextCursor!,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    const [payload, signature] = first.nextCursor!.split('.');
    await expect(
      service.organizations(access, {
        pageSize: 10,
        cursor: `${payload}.${signature}0`,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns privacy-safe not found results', async () => {
    repository.organization.mockResolvedValue(null);
    repository.clinic.mockResolvedValue(null);
    await expect(service.organization(organization.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.clinic(clinic.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('cleans a clinic location and refuses half a map pin', async () => {
    repository.updateClinicLocation.mockResolvedValue(clinic);
    await service.updateClinicLocation(
      access,
      clinic.id,
      {
        address: '  Kurdistan St,   near the Grand Bazaar ',
        city: 'Duhok',
        latitude: 36.8669,
        longitude: 42.9886,
        phoneNumber: '0750 123 4567',
      },
      'request',
    );
    expect(repository.updateClinicLocation.mock.calls[0]![2]).toEqual({
      address: 'Kurdistan St, near the Grand Bazaar',
      area: null,
      city: 'Duhok',
      latitude: 36.8669,
      longitude: 42.9886,
      phoneNumber: '07501234567',
    });
    await expect(
      service.updateClinicLocation(
        access,
        clinic.id,
        { latitude: 36.8 },
        'request',
      ),
    ).rejects.toThrow('both');
    await expect(
      service.updateClinicLocation(
        access,
        clinic.id,
        { phoneNumber: 'call me' },
        'request',
      ),
    ).rejects.toThrow('phone');
  });
});
