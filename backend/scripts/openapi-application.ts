import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { PRODUCT_API_PREFIX } from '../src/common/api/api.constants';

export async function createOpenApiApplication(): Promise<INestApplication> {
  process.env.SAXLEM_BACKEND_ENV = 'test';
  process.env.DATABASE_URL ??= 'postgresql://openapi.invalid/saxlem';
  process.env.ACCESS_TOKEN_SECRET ??=
    'openapi-access-secret-at-least-32-characters';
  process.env.REFRESH_TOKEN_SECRET ??=
    'openapi-refresh-secret-at-least-32-characters';
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix(PRODUCT_API_PREFIX, {
    exclude: ['health/live', 'health/ready'],
  });
  return app;
}

export function createOpenApiDocument(app: INestApplication) {
  return SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Saxlem API')
      .setDescription('Versioned Saxlem backend contract')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
}
