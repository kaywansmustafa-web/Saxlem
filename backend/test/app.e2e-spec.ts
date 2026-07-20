import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { loadConfiguration } from './../src/config/environment';

describe('Operational health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.SAXLEM_BACKEND_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://e2e.invalid/saxlem';
    process.env.ACCESS_TOKEN_SECRET =
      'e2e-access-secret-at-least-32-characters';
    process.env.REFRESH_TOKEN_SECRET =
      'e2e-refresh-secret-at-least-32-characters';
    process.env.OTP_SECRET = 'e2e-otp-secret-at-least-32-characters';
    process.env.AUDIT_HASH_SECRET = 'e2e-audit-secret-at-least-32-characters';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.register(loadConfiguration())],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health/live (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect({ status: 'ok' });
  });

  afterEach(async () => {
    await app.close();
  });
});
