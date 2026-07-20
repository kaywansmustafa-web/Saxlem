import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { BACKEND_CONFIGURATION } from '../../config/configuration.module';
import type { BackendConfiguration } from '../../config/environment';
import type { DatabaseHealth } from './database-health';

@Injectable()
export class PrismaService implements DatabaseHealth, OnModuleDestroy {
  private readonly client: PrismaClient;

  constructor(
    @Inject(BACKEND_CONFIGURATION) configuration: BackendConfiguration,
  ) {
    const adapter = new PrismaPg({
      connectionString: configuration.databaseUrl,
    });
    this.client = new PrismaClient({ adapter });
  }

  get db(): PrismaClient {
    return this.client;
  }

  async isReady(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async invalidClinicTimezones(): Promise<readonly string[]> {
    const zones = await this.client.clinic.findMany({
      where: { status: 'active' },
      distinct: ['timezone'],
      select: { timezone: true },
    });
    return zones
      .map(({ timezone }) => timezone)
      .filter((timezone) => {
        try {
          new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
          return false;
        } catch {
          return true;
        }
      });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
