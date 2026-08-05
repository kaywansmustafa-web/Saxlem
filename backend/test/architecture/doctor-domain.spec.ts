import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('doctor domain architecture', () => {
  const controller = () =>
    readFileSync(
      join(
        process.cwd(),
        'src/modules/doctors/presentation/doctors.controller.ts',
      ),
      'utf8',
    );

  it('keeps Prisma and mock data outside presentation', () => {
    expect(controller()).not.toContain('@prisma/client');
    expect(controller().toLowerCase()).not.toContain('mock');
  });

  it('exposes exactly the approved read-only route surface', () => {
    const source = controller();
    for (const route of [
      '@Get()',
      "@Get('discovery-options')",
      "@Get(':id')",
      "@Get(':id/profile')",
      "@Get(':id/specialties')",
      "@Get(':id/availability')",
    ])
      expect(source).toContain(route);
    for (const mutation of ['@Post(', '@Patch(', '@Delete('])
      expect(source).not.toContain(mutation);
  });

  it('documents authentication, validation, pagination, filters, and visibility failures', () => {
    const source = controller();
    for (const contract of [
      '@ApiBearerAuth()',
      '@ApiBadRequestResponse',
      '@ApiUnauthorizedResponse',
      '@ApiForbiddenResponse',
      '@ApiNotFoundResponse',
      'DoctorPageResponseDto',
    ])
      expect(source).toContain(contract);
    expect(source.indexOf("@Get('discovery-options')")).toBeLessThan(
      source.indexOf("@Get(':id')"),
    );
    expect(source).toContain("@RequireCapabilities('doctor:directory:read')");
    expect(source).toContain('@UseGuards(JwtAuthGuard)');
  });

  it('keeps internal doctor fields out of public DTO definitions', () => {
    const dto = readFileSync(
      join(process.cwd(), 'src/modules/doctors/presentation/doctor.dto.ts'),
      'utf8',
    );
    for (const internal of [
      'profilePhotoKey',
      'organizationId',
      'createdAt',
      'version',
    ])
      expect(dto).not.toContain(internal);
  });

  it('generates a privacy-safe and complete OpenAPI contract', () => {
    const document = JSON.parse(
      readFileSync(join(process.cwd(), 'openapi/saxlem-api.json'), 'utf8'),
    ) as {
      paths: Record<
        string,
        {
          get?: {
            parameters?: Array<{
              name: string;
              schema?: Record<string, unknown>;
            }>;
            responses: Record<string, unknown>;
          };
        }
      >;
      components: {
        schemas: Record<
          string,
          { properties?: Record<string, Record<string, unknown>> }
        >;
      };
    };
    const serialized = JSON.stringify(document.components.schemas);
    expect(serialized).not.toContain('profilePhotoKey');
    expect(
      document.components.schemas.DoctorListItemResponseDto?.properties
        ?.profileImageUrl,
    ).toMatchObject({ type: 'string', nullable: true });
    expect(
      document.paths['/api/v1/doctors']?.get?.parameters?.find(
        ({ name }) => name === 'page',
      )?.schema,
    ).toMatchObject({
      type: 'integer',
      minimum: 1,
      maximum: 10000,
      default: 1,
    });
    expect(
      document.paths['/api/v1/doctors']?.get?.parameters?.find(
        ({ name }) => name === 'pageSize',
      )?.schema,
    ).toMatchObject({
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 20,
    });
    expect(
      document.paths['/api/v1/doctors']?.get?.parameters?.find(
        ({ name }) => name === 'minimumYearsOfExperience',
      )?.schema,
    ).toMatchObject({ type: 'integer', minimum: 0, maximum: 80 });
    expect(
      document.paths['/api/v1/doctors']?.get?.parameters?.find(
        ({ name }) => name === 'clinicId',
      )?.schema,
    ).toMatchObject({ type: 'string', format: 'uuid' });
    expect(
      document.paths['/api/v1/doctors']?.get?.parameters?.find(
        ({ name }) => name === 'gender',
      )?.schema,
    ).toMatchObject({
      type: 'string',
      enum: ['female', 'male', 'unspecified'],
    });
    const options =
      document.components.schemas.DoctorDiscoveryOptionsResponseDto;
    expect(options?.properties).toEqual({
      specialties: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/DoctorDiscoverySpecialtyOptionResponseDto',
        },
      },
      clinics: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/DoctorDiscoveryClinicOptionResponseDto',
        },
      },
      languages: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'badiniKurdish',
            'soraniKurdish',
            'arabic',
            'english',
            'turkish',
          ],
        },
      },
      genders: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['female', 'male', 'unspecified'],
        },
      },
      experience: {
        $ref: '#/components/schemas/DoctorDiscoveryExperienceOptionResponseDto',
      },
    });
    expect(
      document.components.schemas.DoctorDiscoveryExperienceOptionResponseDto
        ?.properties,
    ).toEqual({
      minimum: { type: 'integer', nullable: true, minimum: 0 },
      maximum: { type: 'integer', nullable: true, minimum: 0 },
    });
    expect(
      document.paths['/api/v1/doctors/discovery-options']?.get?.responses,
    ).toHaveProperty('200');
    expect(
      Object.keys(
        document.components.schemas.DoctorDiscoverySpecialtyOptionResponseDto
          ?.properties ?? {},
      ),
    ).toEqual(['code', 'displayName']);
    expect(
      Object.keys(
        document.components.schemas.DoctorDiscoveryClinicOptionResponseDto
          ?.properties ?? {},
      ),
    ).toEqual(['id', 'name']);
    for (const forbidden of [
      'organizationId',
      'profilePhotoKey',
      'address',
      'licenseNumber',
      'version',
      'createdAt',
    ])
      expect(JSON.stringify(options)).not.toContain(forbidden);
    expect(document.components.schemas).toHaveProperty('ApiErrorEnvelopeDto');
    expect(
      document.paths['/api/v1/doctors/{id}/specialties']?.get?.responses,
    ).toHaveProperty('404');
    expect(
      document.paths['/api/v1/doctors/{id}/availability']?.get?.responses,
    ).toHaveProperty('404');
  });
});
