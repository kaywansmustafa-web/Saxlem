import { Global, Module } from '@nestjs/common';
import { DATABASE_HEALTH } from './database-health';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: DATABASE_HEALTH, useExisting: PrismaService },
  ],
  exports: [PrismaService, DATABASE_HEALTH],
})
export class DatabaseModule {}
