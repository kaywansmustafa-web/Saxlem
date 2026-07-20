import { SetMetadata } from '@nestjs/common';

export const REQUIRED_CAPABILITIES = 'saxlem:required-capabilities';
export const RequireCapabilities = (...capabilities: string[]) =>
  SetMetadata(REQUIRED_CAPABILITIES, capabilities);
