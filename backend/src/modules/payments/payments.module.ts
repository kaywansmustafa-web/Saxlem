import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { IdentityModule } from '../identity/identity.module';
import { PaymentService } from './application/payment.service';
import { PAYMENT_GATEWAYS } from './domain/payment-gateway';
import { PAYMENT_REPOSITORY } from './domain/payment.repository';
import { FibPaymentGateway } from './infrastructure/fib-payment-gateway';
import { PaymentReconciliationWorker } from './infrastructure/payment-reconciliation.worker';
import { PrismaPaymentRepository } from './infrastructure/prisma-payment.repository';
import { SimulatedPaymentGateway } from './infrastructure/simulated-payment-gateway';
import {
  PaymentCallbackController,
  PaymentsController,
} from './presentation/payments.controller';

@Module({
  imports: [IdentityModule, AppointmentsModule],
  controllers: [PaymentsController, PaymentCallbackController],
  providers: [
    PaymentService,
    PrismaPaymentRepository,
    { provide: PAYMENT_REPOSITORY, useExisting: PrismaPaymentRepository },
    FibPaymentGateway,
    SimulatedPaymentGateway,
    {
      provide: PAYMENT_GATEWAYS,
      useFactory: (
        fib: FibPaymentGateway,
        simulated: SimulatedPaymentGateway,
      ) => [fib, simulated],
      inject: [FibPaymentGateway, SimulatedPaymentGateway],
    },
    PaymentReconciliationWorker,
  ],
})
export class PaymentsModule {}
