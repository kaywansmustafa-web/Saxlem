import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';
import { RequestIdMiddleware } from './common/api/request-id.middleware';
import { ConfigurationModule } from './config/configuration.module';
import { HealthModule } from './infrastructure/health/health.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { FoundationModules } from './modules/foundation-modules.module';
import type { BackendConfiguration } from './config/environment';

@Module({})
export class AppModule implements NestModule {
  static register(configuration: BackendConfiguration): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigurationModule.register(configuration),
        DatabaseModule,
        LoggerModule.forRoot({
          pinoHttp: {
            level: configuration.logLevel,
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.otp',
                'req.body.phone',
                'req.body.phoneNumber',
                'req.body.email',
                'req.body.password',
                'req.body.refreshToken',
                'res.body.developmentOtp',
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
    };
  }
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
