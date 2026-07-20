import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createApplication } from '../../src/main';
import { loadConfiguration } from '../../src/config/environment';

const base = {
  SAXLEM_BACKEND_ENV: 'test',
  ACCESS_TOKEN_SECRET: 'integration-access-secret-at-least-32-characters',
  REFRESH_TOKEN_SECRET: 'integration-refresh-secret-at-least-32-characters',
};

async function appFor(databaseUrl: string): Promise<INestApplication<App>> {
  process.env.DATABASE_URL = databaseUrl;
  const configuration = loadConfiguration({
    ...base,
    DATABASE_URL: databaseUrl,
  });
  const app = await createApplication(configuration);
  await app.init();
  return app as INestApplication<App>;
}

describe('database-aware readiness', () => {
  it('keeps liveness independent and reports ready for PostgreSQL', async () => {
    const app = await appFor(process.env.TEST_DATABASE_URL!);
    await request(app.getHttpServer())
      .get('/health/live')
      .expect(200, { status: 'ok' });
    await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200, { status: 'ready', checks: ['database'] });
    await app.close();
  });

  it('fails safely without exposing an unavailable connection string', async () => {
    const unavailable =
      'postgresql://hidden:secret@127.0.0.1:59999/saxlem_test';
    const app = await appFor(unavailable);
    const response = await request(app.getHttpServer())
      .get('/health/ready')
      .expect(503);
    const body = response.body as {
      error: { code: string; retryable: boolean };
    };
    expect(JSON.stringify(response.body)).not.toContain('postgresql://');
    expect(JSON.stringify(response.body)).not.toContain('hidden');
    expect(body.error).toMatchObject({
      code: 'INTERNAL_ERROR',
      retryable: true,
    });
    await app.close();
  });
});
