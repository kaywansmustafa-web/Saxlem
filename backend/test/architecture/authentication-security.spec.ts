import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('authentication security contracts', () => {
  it('marks credential inputs write-only in OpenAPI', () => {
    const document = JSON.parse(
      readFileSync(join(process.cwd(), 'openapi/saxlem-api.json'), 'utf8'),
    ) as {
      components: {
        schemas: Record<
          string,
          { properties: Record<string, { writeOnly?: boolean }> }
        >;
      };
    };
    expect(
      document.components.schemas['VerifyOtpDto']!.properties['otp']!.writeOnly,
    ).toBe(true);
    expect(
      document.components.schemas['LoginDto']!.properties['password']!
        .writeOnly,
    ).toBe(true);
    expect(
      document.components.schemas['RefreshDto']!.properties['refreshToken']!
        .writeOnly,
    ).toBe(true);
  });

  it('keeps JWT and tenant enforcement in the identity boundary', () => {
    const guard = readFileSync(
      join(
        process.cwd(),
        'src/modules/identity/presentation/jwt-auth.guard.ts',
      ),
      'utf8',
    );
    expect(guard).toContain("algorithms: ['HS256']");
    expect(guard).toContain("issuer: 'saxlem'");
    expect(guard).toContain("audience: 'saxlem-clients'");
    expect(guard).toContain('Tenant context does not match.');
  });
});
