import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { setTimeout as sleep } from 'node:timers/promises';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { PaymentService } from '../application/payment.service';

/** Confirms pending online payments and closes or refunds payments of
 * cancelled appointments. Provider callbacks only speed this up. */
@Injectable()
export class PaymentReconciliationWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(PaymentReconciliationWorker.name);
  private readonly abortController = new AbortController();
  private loop?: Promise<void>;

  constructor(
    private readonly payments: PaymentService,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.configuration.paymentWorkerEnabled) return;
    this.loop = this.run();
  }

  async onApplicationShutdown(): Promise<void> {
    this.abortController.abort();
    await this.loop;
  }

  private async run() {
    while (!this.abortController.signal.aborted) {
      try {
        await this.payments.reconcile();
      } catch (error) {
        this.logger.error(
          `Payment reconciliation failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
      try {
        await sleep(this.configuration.paymentWorkerPollIntervalMs, undefined, {
          signal: this.abortController.signal,
        });
      } catch {
        return;
      }
    }
  }
}
