import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DATABASE_HEALTH,
  type DatabaseHealth,
} from '../database/database-health';

@ApiTags('operations')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(DATABASE_HEALTH) private readonly database: DatabaseHealth,
  ) {}

  @Get('live')
  @ApiOperation({ summary: 'Process liveness' })
  live(): { readonly status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Dependency readiness' })
  async ready(): Promise<{
    readonly status: 'ready';
    readonly checks: readonly string[];
  }> {
    if (!(await this.database.isReady())) {
      throw new ServiceUnavailableException('Database is not ready.');
    }
    if (
      this.database.invalidClinicTimezones &&
      (await this.database.invalidClinicTimezones()).length > 0
    ) {
      throw new ServiceUnavailableException(
        'Clinic timezone configuration is incompatible with this runtime.',
      );
    }
    return { status: 'ready', checks: ['database', 'clinic-timezones'] };
  }
}
