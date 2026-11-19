import { loadConfiguration, readServiceAccount } from './environment';

const key = {
  type: 'service_account',
  project_id: 'saxlem-prod',
  client_email: 'push@saxlem-prod.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
};

describe('Firebase service account', () => {
  it('reads the JSON as downloaded or base64-encoded', () => {
    const expected = {
      projectId: 'saxlem-prod',
      clientEmail: key.client_email,
      privateKey: key.private_key,
    };
    expect(readServiceAccount(JSON.stringify(key))).toEqual(expected);
    expect(
      readServiceAccount(Buffer.from(JSON.stringify(key)).toString('base64')),
    ).toEqual(expected);
    expect(readServiceAccount('{"project_id":"x"}')).toBeNull();
    expect(readServiceAccount('')).toBeNull();
  });

  it('refuses to start with push on and no key', () => {
    const base = {
      SAXLEM_BACKEND_ENV: 'development',
      DATABASE_URL: 'postgresql://u@localhost:5435/saxlem_development',
      ACCESS_TOKEN_SECRET: 'push-access-secret-at-least-32-characters',
      REFRESH_TOKEN_SECRET: 'push-refresh-secret-at-least-32-characters',
      OTP_SECRET: 'push-otp-secret-at-least-32-characters',
      AUDIT_HASH_SECRET: 'push-audit-secret-at-least-32-characters',
    };
    expect(() => loadConfiguration({ ...base, PUSH_PROVIDER: 'fcm' })).toThrow(
      /FIREBASE_SERVICE_ACCOUNT/,
    );
    expect(
      loadConfiguration({
        ...base,
        PUSH_PROVIDER: 'fcm',
        FIREBASE_SERVICE_ACCOUNT: JSON.stringify(key),
      }).push.serviceAccount?.projectId,
    ).toBe('saxlem-prod');
  });
});
