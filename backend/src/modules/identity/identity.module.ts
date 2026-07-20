import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationService } from './application/authentication.service';
import { AuthController } from './presentation/auth.controller';
import { JwtAuthGuard } from './presentation/jwt-auth.guard';
import { InMemoryRateLimiter } from './infrastructure/in-memory-rate-limiter';
import { RATE_LIMIT_BOUNDARY } from './domain/providers';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthenticationService,
    JwtAuthGuard,
    InMemoryRateLimiter,
    { provide: RATE_LIMIT_BOUNDARY, useExisting: InMemoryRateLimiter },
  ],
  exports: [
    JwtModule,
    AuthenticationService,
    JwtAuthGuard,
    RATE_LIMIT_BOUNDARY,
  ],
})
export class IdentityModule {}
