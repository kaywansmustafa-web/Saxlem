import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('platform control OpenAPI', () => {
  const document = JSON.parse(
    readFileSync(join(process.cwd(), 'openapi/saxlem-api.json'), 'utf8'),
  ) as {
    paths: Record<string, Record<string, unknown>>;
    components: {
      schemas: Record<string, { properties?: Record<string, unknown> }>;
    };
  };
  it('documents the global control-plane routes', () => {
    for (const path of [
      '/api/v1/platform/staff',
      '/api/v1/platform/patients',
      '/api/v1/platform/live-operations',
      '/api/v1/platform/analytics/executive',
      '/api/v1/platform/audit-events',
      '/api/v1/platform/search',
      '/api/v1/platform/documents',
      '/api/v1/platform/doctors',
      '/api/v1/platform/settings',
    ])
      expect(document.paths[path]).toBeDefined();
  });
  it('documents safe staff and patient allowlists', () => {
    expect(
      Object.keys(
        document.components.schemas.StaffResponseDto!.properties!,
      ).sort(),
    ).toEqual([
      'createdAt',
      'doctorId',
      'doctorName',
      'email',
      'memberships',
      'roles',
      'staffAccountId',
      'status',
      'updatedAt',
      'userId',
    ]);
    expect(
      Object.keys(document.components.schemas.PatientSummaryDto!.properties!),
    ).not.toEqual(
      expect.arrayContaining([
        'dateOfBirth',
        'diagnosis',
        'clinicalNotes',
        'address',
      ]),
    );
  });
  it('uses stable DTOs instead of generic objects for mutations', () => {
    expect(document.components.schemas.DoctorMutationResponseDto).toBeDefined();
    expect(document.components.schemas.OwnerSettingsResponseDto).toBeDefined();
    expect(document.components.schemas.AuditEventPageResponseDto).toBeDefined();
  });
});
