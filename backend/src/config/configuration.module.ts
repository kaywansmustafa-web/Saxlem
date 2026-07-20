import { DynamicModule, Global, Module } from '@nestjs/common';
import { BackendConfiguration, loadConfiguration } from './environment';

export const BACKEND_CONFIGURATION = Symbol('BACKEND_CONFIGURATION');

@Global()
@Module({})
export class ConfigurationModule {
  static register(
    configuration: BackendConfiguration = loadConfiguration(),
  ): DynamicModule {
    return {
      module: ConfigurationModule,
      global: true,
      providers: [{ provide: BACKEND_CONFIGURATION, useValue: configuration }],
      exports: [BACKEND_CONFIGURATION],
    };
  }
}
