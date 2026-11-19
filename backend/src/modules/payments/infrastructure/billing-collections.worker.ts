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
import { StatementService } from '../application/statement.service';

/** Hourly: carries unpaid balances into the next statement and hides or
 * shows doctors in the patient app (see common/billing/collections). */
@Injectable()
export class BillingCollectionsWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(BillingCollectionsWorker.name);
  private readonly abortController = new AbortController();
  private loop?: Promise<void>;

  constructor(
    private readonly statements: StatementService,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.configuration.billingCollectionsWorkerEnabled) return;
    this.loop = this.run();
  }

  async onApplicationShutdown(): Promise<void> {
    this.abortController.abort();
    await this.loop;
  }

  private async run() {
    while (!this.abortController.signal.aborted) {
      try {
        const { carried, changed } = await this.statements.runCollections();
        if (carried || changed)
          this.logger.log(
            `Collections: ${carried} carried, ${changed} visibility changes.`,
          );
      } catch (error) {
        this.logger.error(
          `Collections run failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
      try {
        await sleep(
          this.configuration.billingCollectionsIntervalMs,
          undefined,
          { signal: this.abortController.signal },
        );
      } catch {
        return;
      }
    }
  }
}
