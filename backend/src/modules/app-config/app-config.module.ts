import { Global, Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import {
  AppConfigController,
  PlatformCatalogController,
} from './app-config.controller';
import { AppSettings } from './app-settings.service';
import { CatalogService } from './catalog.service';

/** App catalog and owner settings. Global so any service can read settings. */
@Global()
@Module({
  imports: [IdentityModule],
  controllers: [AppConfigController, PlatformCatalogController],
  providers: [AppSettings, CatalogService],
  exports: [AppSettings, CatalogService],
})
export class AppConfigModule {}
