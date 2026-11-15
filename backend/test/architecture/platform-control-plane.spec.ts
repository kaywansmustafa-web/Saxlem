import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('platform owner control plane', () => {
  const root = process.cwd();
  const controller = readFileSync(
    join(
      root,
      'src/modules/platform-control/presentation/platform-control.controller.ts',
    ),
    'utf8',
  );
  const service = readFileSync(
    join(
      root,
      'src/modules/platform-control/application/platform-control.service.ts',
    ),
    'utf8',
  );
  const dto = readFileSync(
    join(
      root,
      'src/modules/platform-control/presentation/platform-control.dto.ts',
    ),
    'utf8',
  );

  it('enforces both the platform capability and exact global administrator identity', () => {
    expect(controller).toContain(
      "@RequireCapabilities('platform:administration')",
    );
    expect(controller).toContain(
      "req.principal.kind !== 'platformAdministrator'",
    );
    expect(controller).toContain('req.tenant?.organizationId');
    expect(controller).toContain('req.tenant?.clinicId');
    expect(controller).toContain('ForbiddenException');
  });

  it('keeps patient responses administrative and privacy-minimized', () => {
    expect(dto).toContain('maskedPhone');
    for (const forbidden of [
      'diagnosis',
      'clinicalNotes',
      'consultationNotes',
      'dateOfBirth',
      'address',
    ])
      expect(dto).not.toContain(forbidden);
    expect(service).toContain("action: 'patient.administrative-viewed'");
    expect(service).toContain(
      "groupBy({\n            by: ['patientProfileId']",
    );
  });

  it('does not fabricate queue delay and reduces current patient identity', () => {
    expect(service).not.toContain('waiting * 15');
    expect(service).toContain('deriveQueueHealth');
    expect(service).toContain('currentProfile.firstName.slice(0, 1)');
  });

  it('stores only hashed expiring one-time activation credentials', () => {
    expect(service).toContain("keyedHash(\n      'staff-activation'");
    expect(service).toContain("randomBytes(32).toString('base64url')");
    expect(service).toContain('consumedAt');
    expect(service).not.toContain('passwordHash: password');
  });
});
