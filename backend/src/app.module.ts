import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';
import { RequestIdMiddleware } from './common/api/request-id.middleware';
import { ConfigurationModule } from './config/configuration.module';
import { HealthModule } from './infrastructure/health/health.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { FoundationModules } from './modules/foundation-modules.module';

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.otp',
            'req.body.phoneNumber',
            'req.body.email',
            'res.headers["set-cookie"]',
          ],
          censor: '[REDACTED]',
        },
        genReqId: (request) =>
          request.headers['x-request-id']?.toString() ?? randomUUID(),
      },
    }),
    HealthModule,
    FoundationModules,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
