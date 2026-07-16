import { Global, Module } from '@nestjs/common';
import { BackendConfiguration, loadConfiguration } from './environment';

export const BACKEND_CONFIGURATION = Symbol('BACKEND_CONFIGURATION');

@Global()
@Module({
  providers: [
    {
      provide: BACKEND_CONFIGURATION,
      useFactory: (): BackendConfiguration => loadConfiguration(),
    },
  ],
  exports: [BACKEND_CONFIGURATION],
})
export class ConfigurationModule {}
