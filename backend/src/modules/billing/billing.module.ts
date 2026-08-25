import { Global, Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { BillingService } from './application/billing.service';
import { BILLING_REPOSITORY } from './domain/billing.repository';
import { PrismaBillingRepository } from './infrastructure/prisma-billing.repository';
import { BillingController } from './presentation/billing.controller';

@Global()
@Module({
  imports: [IdentityModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    PrismaBillingRepository,
    { provide: BILLING_REPOSITORY, useExisting: PrismaBillingRepository },
  ],
  exports: [BillingService, BILLING_REPOSITORY],
})
export class BillingModule {}
