import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Sprint 13S administration OpenAPI contract', () => {
  const document = JSON.parse(
    readFileSync(join(process.cwd(), 'openapi', 'saxlem-api.json'), 'utf8'),
  ) as {
    paths: Record<string, Record<string, unknown>>;
    components: {
      schemas: Record<
        string,
        { properties?: Record<string, unknown>; required?: string[] }
      >;
    };
  };

  it('documents only the six minimum administration routes', () => {
    const routes = Object.keys(document.paths).filter((path) =>
      path.includes('/administration/'),
    );
    expect(routes.sort()).toEqual([
      '/api/v1/administration/clinics',
      '/api/v1/administration/clinics/{clinicId}',
      '/api/v1/administration/organizations',
      '/api/v1/administration/organizations/{organizationId}',
    ]);
    expect(
      Object.keys(document.paths['/api/v1/administration/organizations']!),
    ).toEqual(expect.arrayContaining(['get', 'post']));
    expect(
      Object.keys(document.paths['/api/v1/administration/clinics']!),
    ).toEqual(expect.arrayContaining(['get', 'post']));
  });

  it('documents strict response allowlists and scalar metadata', () => {
    expect(
      Object.keys(
        document.components.schemas.OrganizationResponseDto!.properties!,
      ).sort(),
    ).toEqual(['createdAt', 'id', 'name', 'status', 'updatedAt']);
    expect(
      Object.keys(
        document.components.schemas.ClinicResponseDto!.properties!,
      ).sort(),
    ).toEqual([
      'code',
      'createdAt',
      'id',
      'name',
      'organizationId',
      'status',
      'timezone',
      'updatedAt',
    ]);
    expect(
      document.components.schemas.OrganizationResponseDto!.properties!.id,
    ).toMatchObject({ type: 'string', format: 'uuid' });
    expect(
      document.components.schemas.ClinicResponseDto!.properties!.organizationId,
    ).toMatchObject({ type: 'string', format: 'uuid' });
    expect(
      document.components.schemas.OrganizationPageResponseDto!.properties!
        .nextCursor,
    ).toMatchObject({ type: 'string', nullable: true });
  });

  it('documents bounded pagination and required idempotency headers', () => {
    const list = document.paths['/api/v1/administration/organizations']!
      .get as { parameters: Array<Record<string, unknown>> };
    expect(
      list.parameters.find((item) => item.name === 'pageSize'),
    ).toMatchObject({
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
    });
    const create = document.paths['/api/v1/administration/organizations']!
      .post as { parameters: Array<Record<string, unknown>> };
    expect(
      create.parameters.find((item) => item.name === 'Idempotency-Key'),
    ).toMatchObject({
      in: 'header',
      required: true,
      schema: { type: 'string', minLength: 8, maxLength: 128 },
    });
  });
});
