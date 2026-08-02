import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('patient domain architecture', () => {
  it('keeps presentation away from Prisma and mock data', () => {
    const controller = readFileSync(
      join(
        process.cwd(),
        'src/modules/patients/presentation/patients.controller.ts',
      ),
      'utf8',
    );
    expect(controller).not.toContain('@prisma/client');
    expect(controller.toLowerCase()).not.toContain('mock');
  });

  it('exposes only the approved patient routes', () => {
    const controller = readFileSync(
      join(
        process.cwd(),
        'src/modules/patients/presentation/patients.controller.ts',
      ),
      'utf8',
    );
    expect(controller).toContain("@Controller('patients')");
    for (const route of [
      "@Get('directory')",
      "@Get('directory/:patientProfileId')",
      "@Get('me')",
      "@Get('profiles')",
      "@Get('profiles/:id')",
      "@Post('profiles')",
      "@Patch('profiles/:id')",
      "@Post('active')",
      "@Delete('profiles/:id')",
    ])
      expect(controller).toContain(route);
  });

  it('documents authentication, validation, ownership, and concurrency responses', () => {
    const controller = readFileSync(
      join(
        process.cwd(),
        'src/modules/patients/presentation/patients.controller.ts',
      ),
      'utf8',
    );
    for (const contract of [
      '@ApiBearerAuth()',
      '@ApiBadRequestResponse',
      '@ApiUnauthorizedResponse',
      '@ApiForbiddenResponse',
      '@ApiNotFoundResponse',
      '@ApiConflictResponse',
    ])
      expect(controller).toContain(contract);
  });

  it('keeps directory DTOs explicit and cursor signing server-side', () => {
    const dto = readFileSync(
      join(process.cwd(), 'src/modules/patients/presentation/patient.dto.ts'),
      'utf8',
    );
    const service = readFileSync(
      join(
        process.cwd(),
        'src/modules/patients/application/patient.service.ts',
      ),
      'utf8',
    );
    expect(dto).toContain('PatientDirectoryAppointmentsResponseDto');
    expect(dto).not.toContain("type: 'object'");
    expect(dto).not.toContain('PatientDirectoryProfileSummaryResponseDto');
    expect(service).toContain("'patient-directory-pagination-cursor'");
    expect(service).toContain('safeEqualHex');
  });
});
