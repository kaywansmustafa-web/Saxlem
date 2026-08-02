/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('patient directory OpenAPI contract', () => {
  const document = JSON.parse(
    readFileSync(join(process.cwd(), 'openapi/saxlem-api.json'), 'utf8'),
  );

  it('documents bounded scalar query parameters', () => {
    const parameters =
      document.paths['/api/v1/patients/directory'].get.parameters;
    const pageSize = parameters.find(
      (item: { name: string }) => item.name === 'pageSize',
    ).schema;
    const cursor = parameters.find(
      (item: { name: string }) => item.name === 'cursor',
    ).schema;
    expect(pageSize).toMatchObject({
      type: 'integer',
      minimum: 1,
      maximum: 25,
      default: 10,
    });
    expect(cursor).toMatchObject({ type: 'string', maxLength: 2048 });
  });

  it('uses explicit allowlisted response schemas', () => {
    const schemas = document.components.schemas;
    expect(
      document.paths['/api/v1/patients/directory'].get.responses['200'].content[
        'application/json'
      ].schema.$ref,
    ).toBe('#/components/schemas/PatientDirectoryPageResponseDto');
    expect(
      document.paths['/api/v1/patients/directory/{patientProfileId}'].get
        .responses['200'].content['application/json'].schema.$ref,
    ).toBe('#/components/schemas/PatientDirectoryProfileDetailResponseDto');
    expect(
      Object.keys(
        schemas.PatientDirectoryProfileDetailResponseDto.properties,
      ).sort(),
    ).toEqual(['active', 'appointments', 'displayName', 'patientProfileId']);
    expect(
      schemas.PatientDirectoryProfileDetailResponseDto.properties.appointments
        .$ref,
    ).toBe('#/components/schemas/PatientDirectoryAppointmentsResponseDto');
    expect(
      schemas.PatientDirectoryPageResponseDto.properties.nextCursor,
    ).toMatchObject({
      type: 'string',
      nullable: true,
    });
    expect(
      JSON.stringify({
        page: schemas.PatientDirectoryPageResponseDto,
        detail: schemas.PatientDirectoryProfileDetailResponseDto,
      }),
    ).not.toContain('"type":"object","additionalProperties"');
  });
});
