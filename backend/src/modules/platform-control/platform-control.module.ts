import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { PlatformControlService } from './application/platform-control.service';
import { BACKEND_CONFIGURATION } from '../../config/configuration.module';
import type { BackendConfiguration } from '../../config/environment';
import { DOCUMENT_STORAGE } from './domain/document-storage';
import {
  LocalDocumentStorage,
  UnavailableDocumentStorage,
} from './infrastructure/local-document.storage';
import {
  PlatformControlController,
  StaffActivationController,
} from './presentation/platform-control.controller';

@Module({
  imports: [IdentityModule],
  providers: [
    PlatformControlService,
    LocalDocumentStorage,
    {
      provide: DOCUMENT_STORAGE,
      inject: [BACKEND_CONFIGURATION, LocalDocumentStorage],
      useFactory: (
        configuration: BackendConfiguration,
        local: LocalDocumentStorage,
      ) =>
        configuration.environment === 'development' ||
        configuration.environment === 'test'
          ? local
          : new UnavailableDocumentStorage(),
    },
  ],
  controllers: [PlatformControlController, StaffActivationController],
})
export class PlatformControlModule {}
