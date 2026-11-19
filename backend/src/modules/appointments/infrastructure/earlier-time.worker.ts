import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { EarlierTimeService } from '../application/earlier-time.service';

/** Checks for earlier times every 5 minutes, with the notification worker. */
@Injectable()
export class EarlierTimeWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(EarlierTimeWorker.name);
  private timer?: NodeJS.Timeout;
  private running: Promise<void> | undefined;

  constructor(
    private readonly earlier: EarlierTimeService,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.configuration.notificationWorkerEnabled) return;
    const tick = () => {
      if (this.running) return;
      this.running = this.earlier
        .offer()
        .then(() => undefined)
        .catch(() =>
          this.logger.warn({ outcomeCode: 'EARLIER_TIME_TICK_FAILED' }),
        )
        .finally(() => (this.running = undefined));
    };
    this.timer = setInterval(tick, 5 * 60_000);
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.running;
  }
}
