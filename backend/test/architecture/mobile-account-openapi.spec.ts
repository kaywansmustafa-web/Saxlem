/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('mobile authentication and patient account OpenAPI contracts', () => {
  const document = JSON.parse(
    readFileSync(join(process.cwd(), 'openapi/saxlem-api.json'), 'utf8'),
  );

  const responseSchema = (path: string, method: string, status: string) =>
    document.paths[path][method].responses[status].content['application/json']
      .schema;

  it('documents the existing OTP challenge and token responses', () => {
    expect(responseSchema('/api/v1/auth/request-otp', 'post', '202').$ref).toBe(
      '#/components/schemas/OtpChallengeResponseDto',
    );
    expect(responseSchema('/api/v1/auth/verify-otp', 'post', '200').$ref).toBe(
      '#/components/schemas/AuthenticationTokensResponseDto',
    );
    expect(responseSchema('/api/v1/auth/refresh', 'post', '200').$ref).toBe(
      '#/components/schemas/AuthenticationTokensResponseDto',
    );

    const schemas = document.components.schemas;
    expect(schemas.OtpChallengeResponseDto.properties.expiresAt).toMatchObject({
      type: 'string',
      format: 'date-time',
    });
    expect(
      schemas.AuthenticationTokensResponseDto.properties.expiresInSeconds,
    ).toMatchObject({ type: 'integer', minimum: 1 });
  });

  it('documents the existing patient account projection for read and activate', () => {
    for (const [path, method] of <readonly [string, string][]>[
      ['/api/v1/patients/me', 'get'],
      ['/api/v1/patients/active', 'post'],
    ]) {
      expect(responseSchema(path, method, '200').$ref).toBe(
        '#/components/schemas/PatientAccountResponseDto',
      );
    }

    const schemas = document.components.schemas;
    expect(
      schemas.PatientAccountResponseDto.properties.activeProfile,
    ).toMatchObject({
      nullable: true,
      allOf: [{ $ref: '#/components/schemas/PatientProfileResponseDto' }],
    });
    expect(
      schemas.PatientAccountResponseDto.properties.profileCount,
    ).toMatchObject({ type: 'integer', minimum: 0 });
    expect(
      Object.keys(schemas.PatientAccountResponseDto.properties).sort(),
    ).toEqual([
      'activeProfile',
      'activeProfileId',
      'createdAt',
      'id',
      'profileCount',
      'updatedAt',
    ]);
  });
});
