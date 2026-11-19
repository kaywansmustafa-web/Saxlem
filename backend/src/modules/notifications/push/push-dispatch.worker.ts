import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { BACKEND_CONFIGURATION } from '../../../config/configuration.module';
import type { BackendConfiguration } from '../../../config/environment';
import { PushDispatchService } from './push-dispatch.service';

/** Sends pushes every 2 seconds, with the notification worker. */
@Injectable()
export class PushDispatchWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(PushDispatchWorker.name);
  private timer?: NodeJS.Timeout;
  private running: Promise<void> | undefined;

  constructor(
    private readonly dispatch: PushDispatchService,
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration: BackendConfiguration,
  ) {}

  onApplicationBootstrap(): void {
    if (
      !this.configuration.notificationWorkerEnabled ||
      this.configuration.push.provider === 'none'
    )
      return;
    this.timer = setInterval(() => {
      if (this.running) return;
      this.running = this.dispatch
        .dispatch()
        .then(() => undefined)
        .catch(() => this.logger.warn({ outcomeCode: 'PUSH_TICK_FAILED' }))
        .finally(() => (this.running = undefined));
    }, 2_000);
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.running;
  }
}
