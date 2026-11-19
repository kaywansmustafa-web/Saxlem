import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { AppointmentService } from '../application/appointment.service';

/**
 * Keeps every bookable doctor's "next free time" current (Home's "Free
 * today", doctor cards): every 3 minutes, with the other workers.
 */
@Injectable()
export class NextFreeWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(NextFreeWorker.name);
  private timer?: NodeJS.Timeout;
  private running: Promise<void> | undefined;

  constructor(
    private readonly appointments: AppointmentService,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.configuration.notificationWorkerEnabled) return;
    const tick = () => {
      if (this.running) return;
      this.running = this.appointments
        .refreshNextFree()
        .then(() => undefined)
        .catch(() => this.logger.warn({ outcomeCode: 'NEXT_FREE_TICK_FAILED' }))
        .finally(() => (this.running = undefined));
    };
    tick();
    this.timer = setInterval(tick, 3 * 60_000);
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.running;
  }
}
