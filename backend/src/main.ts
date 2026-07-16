import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { PRODUCT_API_PREFIX } from './common/api/api.constants';
import { ApiExceptionFilter } from './common/errors/api-exception.filter';
import { BackendConfiguration, loadConfiguration } from './config/environment';

export async function createApplication(configuration = loadConfiguration()) {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix(PRODUCT_API_PREFIX, {
    exclude: ['health/live', 'health/ready'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  if (configuration.corsOrigins.length) {
    app.enableCors({ origin: configuration.corsOrigins, credentials: true });
  }
  configureOpenApi(app, configuration);
  return app;
}

function configureOpenApi(
  app: Awaited<ReturnType<typeof NestFactory.create>>,
  configuration: BackendConfiguration,
): void {
  if (
    !configuration.openApiEnabled &&
    configuration.environment === 'production'
  )
    return;
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Saxlem API')
      .setDescription('Versioned Saxlem backend contract')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup(`${PRODUCT_API_PREFIX}/docs`, app, document);
}

async function bootstrap(): Promise<void> {
  const configuration = loadConfiguration();
  const app = await createApplication(configuration);
  await app.listen(configuration.port);
}

if (require.main === module) {
  void bootstrap();
}
